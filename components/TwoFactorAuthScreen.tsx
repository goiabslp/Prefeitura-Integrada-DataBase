import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle, AlertTriangle, Lock, ArrowLeft, Plus } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from '../services/supabaseClient';

interface TwoFactorAuthScreenProps {
    currentUser: User;
    onUpdateUser: (updatedUser: User) => void;
    onBack?: () => void;
}

export const TwoFactorAuthScreen: React.FC<TwoFactorAuthScreenProps> = ({ currentUser, onUpdateUser, onBack }) => {
    // We track which slot we are currently editing/viewing in detail (1 or 2)
    // If null, we show the dashboard with both cards.
    const [editingSlot, setEditingSlot] = useState<1 | 2 | null>(null);

    // Setup state
    const [step, setStep] = useState<'intro' | 'setup' | 'verify'>('intro');
    const [secret, setSecret] = useState<string>('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Clear success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const isEnabled1 = currentUser.twoFactorEnabled || false;
    const isEnabled2 = currentUser.twoFactorEnabled2 || false;

    // Reset setup state when switching slots or closing
    const resetSetupState = () => {
        setStep('intro');
        setSecret('');
        setQrCodeUrl('');
        setToken('');
        setError('');
        setLoading(false);
    };

    const handleStartSetup = async (slot: 1 | 2) => {
        setEditingSlot(slot);
        setSuccessMessage(null); // Clear any previous success message
        setLoading(true);
        setError('');

        // Generate new secret
        const newSecret = new OTPAuth.Secret({ size: 20 });
        const secretStr = newSecret.base32;
        setSecret(secretStr);

        // Label distinguishes the key in the app (e.g. "User (Primary)" vs "User (Backup)")
        const label = `${currentUser.username}${slot === 2 ? ' (Backup)' : ''}`;

        const totp = new OTPAuth.TOTP({
            issuer: 'Assinatura Prefeitura Goiabal',
            label: label,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: newSecret
        });

        try {
            const url = await QRCode.toDataURL(totp.toString());
            setQrCodeUrl(url);
            setStep('setup');
        } catch (err) {
            console.error(err);
            setError('Erro ao gerar QR Code.');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        if (!token || token.length !== 6) {
            setError('Digite o código de 6 dígitos.');
            return;
        }

        const totp = new OTPAuth.TOTP({
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(secret)
        });

        const delta = totp.validate({ token, window: 1 });

        if (delta === null) {
            setError('Código inválido. Tente novamente.');
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {};
            if (editingSlot === 1) {
                updateData.two_factor_secret = secret;
                updateData.two_factor_enabled = true;
            } else {
                updateData.two_factor_secret_2 = secret;
                updateData.two_factor_enabled_2 = true;
            }

            const { error: dbError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', currentUser.id);

            if (dbError) throw dbError;

            await supabase.from('audit_logs').insert({
                user_id: currentUser.id,
                action: '2fa_enable',
                details: { method: 'totp', slot: editingSlot }
            });

            const updatedUser = { ...currentUser };
            if (editingSlot === 1) {
                updatedUser.twoFactorEnabled = true;
                updatedUser.twoFactorSecret = secret;
            } else {
                updatedUser.twoFactorEnabled2 = true;
                updatedUser.twoFactorSecret2 = secret;
            }

            onUpdateUser(updatedUser);
            setSuccessMessage(`Autenticador ${editingSlot} ativado com sucesso!`);
            setEditingSlot(null);
            resetSetupState();

        } catch (err: any) {
            console.error(err);
            setError('Erro ao salvar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDisable = async (slot: 1 | 2) => {
        if (!confirm(`Tem certeza que deseja remover o Autenticador ${slot}?`)) return;

        setLoading(true);
        try {
            const updateData: any = {};
            if (slot === 1) {
                updateData.two_factor_secret = null;
                updateData.two_factor_enabled = false;
            } else {
                updateData.two_factor_secret_2 = null;
                updateData.two_factor_enabled_2 = false;
            }

            const { error: dbError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', currentUser.id);

            if (dbError) throw dbError;

            await supabase.from('audit_logs').insert({
                user_id: currentUser.id,
                action: '2fa_disable',
                details: { slot }
            });

            const updatedUser = { ...currentUser };
            if (slot === 1) {
                updatedUser.twoFactorEnabled = false;
                updatedUser.twoFactorSecret = undefined;
            } else {
                updatedUser.twoFactorEnabled2 = false;
                updatedUser.twoFactorSecret2 = undefined;
            }

            onUpdateUser(updatedUser);
            setSuccessMessage(`Autenticador ${slot} desativado.`);
        } catch (err: any) {
            console.error(err);
            alert('Erro ao desativar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // If we are actively editing a slot, show the specialized setup UI
    if (editingSlot) {
        return (
            <div className="w-full max-w-3xl mx-auto p-6 animate-fade-in bg-white border border-slate-200 rounded-3xl shadow-xl my-8">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-800">
                        Configurando Autenticador {editingSlot}
                    </h3>
                    <button
                        onClick={() => { setEditingSlot(null); resetSetupState(); }}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="bg-slate-50 p-8 rounded-3xl text-center border-2 border-slate-100 flex flex-col items-center justify-center">
                        <p className="text-xs font-bold text-slate-500 mb-6 uppercase tracking-widest">Escaneie com seu app</p>
                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                            {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply" />}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <p className="text-[10px] text-slate-400 font-medium">Chave Secreta</p>
                            <code
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-mono select-all cursor-pointer hover:border-indigo-300 transition-colors text-slate-600"
                                onClick={() => navigator.clipboard.writeText(secret)}
                                title="Clique para copiar"
                            >
                                {secret}
                            </code>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Confirme a configuração</h3>
                            <p className="text-sm text-slate-500">Insira o código de 6 dígitos gerado pelo app.</p>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={token}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                    setToken(val);
                                    setError('');
                                }}
                                className="w-full p-4 border-2 border-slate-200 rounded-xl font-mono text-center text-2xl tracking-[0.5em] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                placeholder="000000"
                                autoFocus
                            />

                            <button
                                onClick={verifyAndEnable}
                                disabled={token.length !== 6 || loading}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all hover:shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                Ativar Autenticador {editingSlot}
                            </button>

                            {error && <p className="text-red-500 text-xs text-center font-bold animate-shake bg-red-50 p-2 rounded-lg">{error}</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Dashboard View - Showing 2 Cards
    return (
        <div className="w-full max-w-5xl mx-auto p-8 animate-fade-in relative">
            {successMessage && (
                <div className="mb-6 p-4 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 animate-slide-down shadow-sm">
                    <CheckCircle className="w-6 h-6 shrink-0" />
                    <span className="font-bold">{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto p-1 hover:bg-emerald-200 rounded-full transition-colors">
                        <ArrowLeft className="w-4 h-4 rotate-180" /> {/* Using as close icon approximately */}
                    </button>
                </div>
            )}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                <div className="flex-1">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dispositivos de Segurança</h2>
                    <p className="text-slate-500 mt-1 font-medium">Gerencie até 02 dispositivos autenticadores para sua conta.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slot 1 */}
                <div className={`relative p-8 rounded-[2rem] border-2 transition-all duration-300 ${isEnabled1 ? 'bg-emerald-50 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-white border-slate-200 border-dashed'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isEnabled1 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                            <Smartphone className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${isEnabled1 ? 'text-emerald-900' : 'text-slate-700'}`}>Autenticador 01</h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isEnabled1 ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                                    {isEnabled1 ? 'Ativo' : 'Pendente'}
                                </span>
                            </div>
                        </div>
                        {isEnabled1 && <div className="ml-auto w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 animate-scale-in"><CheckCircle className="w-6 h-6" /></div>}
                    </div>

                    {isEnabled1 ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/50 rounded-xl border border-emerald-100 text-sm text-emerald-800 font-medium leading-relaxed">
                                Este dispositivo está <span className="font-bold underline">protegendo sua conta</span>. O uso dele é obrigatório para assinaturas.
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleStartSetup(1)}
                                    className="py-3 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3 h-3" /> Redefinir
                                </button>
                                <button
                                    onClick={() => confirmDisable(1)}
                                    className="py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-3 h-3" /> Resetar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Configure seu dispositivo principal para habilitar a segurança.</p>
                            <button
                                onClick={() => handleStartSetup(1)}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Configurar Agora
                            </button>
                        </div>
                    )}
                </div>

                {/* Slot 2 */}
                <div className={`relative p-8 rounded-[2rem] border-2 transition-all duration-300 ${isEnabled2 ? 'bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-500/10' : 'bg-white border-slate-200 border-dashed opacity-100'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isEnabled2 ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            <Smartphone className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className={`text-lg font-black ${isEnabled2 ? 'text-indigo-900' : 'text-slate-700'}`}>Autenticador 02</h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isEnabled2 ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
                                    {isEnabled2 ? 'Ativo (Backup)' : 'Opcional'}
                                </span>
                            </div>
                        </div>
                        {isEnabled2 && <div className="ml-auto w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-scale-in"><CheckCircle className="w-6 h-6" /></div>}
                    </div>

                    {isEnabled2 ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-white/50 rounded-xl border border-indigo-100 text-sm text-indigo-800 font-medium leading-relaxed">
                                Dispositivo de backup ativo. Você pode usar qualquer um dos dois para assinar.
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleStartSetup(2)}
                                    className="py-3 bg-white border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-3 h-3" /> Redefinir
                                </button>
                                <button
                                    onClick={() => confirmDisable(2)}
                                    className="py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 hover:border-red-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-3 h-3" /> Resetar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500">Adicione um segundo dispositivo como backup de segurança.</p>
                            <button
                                onClick={() => handleStartSetup(2)}
                                disabled={!isEnabled1}
                                className="w-full py-4 bg-white border-2 border-indigo-100 text-indigo-600 disabled:opacity-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl text-sm font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> {isEnabled1 ? 'Configurar Reserva' : 'Ative o Principal Primeiro'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-blue-900">Como funciona?</h4>
                    <p className="text-sm text-blue-800 mt-1">
                        Você pode configurar até dois aplicativos autenticadores (em celulares diferentes, por exemplo).
                        Ao assinar um documento, <strong>o sistema aceitará o código gerado por QUALQUER UM dos dois dispositivos</strong>.
                    </p>
                </div>
            </div>
        </div>
    );
};
