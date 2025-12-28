import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, Smartphone, RefreshCw, CheckCircle, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase } from '../services/supabaseClient';

interface TwoFactorAuthScreenProps {
    currentUser: User;
    onUpdateUser: (updatedUser: User) => void;
    onBack?: () => void;
}

export const TwoFactorAuthScreen: React.FC<TwoFactorAuthScreenProps> = ({ currentUser, onUpdateUser, onBack }) => {
    const [isEnabled, setIsEnabled] = useState(currentUser.twoFactorEnabled || false);
    const [step, setStep] = useState<'intro' | 'setup' | 'verify' | 'disable_confirm'>('intro');
    const [secret, setSecret] = useState<string>('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Generate new secret and QR code
    const startSetup = async () => {
        setLoading(true);
        // Generate a random secret
        const newSecret = new OTPAuth.Secret({ size: 20 });
        const secretStr = newSecret.base32;
        setSecret(secretStr);

        // Create TOTP object for QR
        const totp = new OTPAuth.TOTP({
            issuer: 'Assinatura Prefeitura Goiabal',
            label: currentUser.username,
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

        // Validate token with a window of 1 (allows +/- 30s drift)
        const delta = totp.validate({ token, window: 1 });

        if (delta === null) {
            setError('Código inválido. Tente novamente.');
            return;
        }

        setLoading(true);
        try {
            // Save secret and enable flag to Supabase
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    two_factor_secret: secret,
                    two_factor_enabled: true
                })
                .eq('id', currentUser.id);

            if (dbError) throw dbError;

            // Log action
            await supabase.from('audit_logs').insert({
                user_id: currentUser.id,
                action: '2fa_enable',
                details: { method: 'totp' }
            });

            // Update local state
            onUpdateUser({ ...currentUser, twoFactorEnabled: true });
            setIsEnabled(true);
            setStep('intro');
            setToken('');
            alert('Autenticação em 2 Etapas ativada com sucesso!');

        } catch (err: any) {
            console.error(err);
            setError('Erro ao salvar configurações: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDisable = async () => {
        if (!confirm("Tem certeza que deseja desativar a proteção 2FA da sua conta?")) return;

        setLoading(true);
        try {
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    two_factor_secret: null,
                    two_factor_enabled: false
                })
                .eq('id', currentUser.id);

            if (dbError) throw dbError;

            // Log action
            await supabase.from('audit_logs').insert({
                user_id: currentUser.id,
                action: '2fa_disable',
                details: {}
            });

            onUpdateUser({ ...currentUser, twoFactorEnabled: false });
            setIsEnabled(false);
            alert('Autenticação em 2 Etapas desativada.');
        } catch (err: any) {
            console.error(err);
            setError('Erro ao desativar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRedo = () => {
        if (!confirm("Ao refazer a configuração, os códigos gerados anteriormente deixarão de funcionar. Deseja continuar?")) return;
        startSetup();
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                {onBack && (
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Autenticação em 2 Etapas</h2>
                        {isEnabled && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">
                                Ativado
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-1 font-medium">Proteja sua assinatura digital com a verificação em duas etapas (2FA).</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 md:p-12">

                    {isEnabled ? (
                        <div className="space-y-8">
                            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div className="p-4 bg-white rounded-full shadow-sm">
                                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-emerald-900 mb-2">Sua conta está protegida!</h3>
                                    <p className="text-emerald-700">
                                        A autenticação em 2 etapas está ativa. Sempre que você assinar um documento, será solicitado o código do seu aplicativo autenticador.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleRedo}
                                    disabled={loading}
                                    className="px-6 py-4 bg-white border-2 border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-900 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="w-5 h-5 text-indigo-600" />
                                    Refazer Configuração
                                </button>

                                <button
                                    onClick={confirmDisable}
                                    disabled={loading}
                                    className="px-6 py-4 bg-red-50 border-2 border-red-100 hover:bg-red-100 text-red-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-3"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                                    Desativar Proteção
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {step === 'intro' && (
                                <div className="space-y-6 text-center max-w-lg mx-auto py-12">
                                    <div className="mx-auto w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                        <Smartphone className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <p className="text-xl text-slate-600 font-medium leading-relaxed">
                                        Adicione uma camada extra de segurança. Utilize aplicativos como Google Authenticator ou Authy para gerar códigos de verificação.
                                    </p>
                                    <button
                                        onClick={startSetup}
                                        disabled={loading}
                                        className="mx-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all flex items-center gap-3 text-lg hover:-translate-y-1"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
                                        Configurar Agora
                                    </button>
                                </div>
                            )}

                            {step === 'setup' && (
                                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                                    <div className="bg-slate-50 p-8 rounded-3xl text-center border-2 border-slate-100 flex flex-col items-center justify-center">
                                        <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">Escaneie com seu app</p>
                                        <div className="bg-white p-4 rounded-2xl shadow-sm mb-6">
                                            {qrCodeUrl && <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply" />}
                                        </div>

                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-xs text-slate-400 font-medium">Não consegue escanear?</p>
                                            <code
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono select-all cursor-pointer hover:border-indigo-300 transition-colors text-slate-600"
                                                onClick={() => navigator.clipboard.writeText(secret)}
                                                title="Clique para copiar"
                                            >
                                                {secret}
                                            </code>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2">Valide seu dispositivo</h3>
                                            <p className="text-slate-500">Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador para confirmar a configuração.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Código de Verificação</label>
                                                <div className="flex gap-3">
                                                    <input
                                                        type="text"
                                                        value={token}
                                                        onChange={e => {
                                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                            setToken(val);
                                                            setError('');
                                                        }}
                                                        className="flex-1 p-4 border-2 border-slate-200 rounded-2xl font-mono text-center text-2xl tracking-[0.5em] focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                                                        placeholder="000000"
                                                    />
                                                    <button
                                                        onClick={verifyAndEnable}
                                                        disabled={token.length !== 6 || loading}
                                                        className="px-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all hover:shadow-lg shadow-emerald-200 flex items-center justify-center"
                                                    >
                                                        {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                                    </button>
                                                </div>
                                                {error && <p className="text-red-500 text-sm mt-3 flex items-center gap-2 font-medium animate-shake"><AlertTriangle className="w-4 h-4" /> {error}</p>}
                                            </div>
                                        </div>

                                        <button onClick={() => setStep('intro')} className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center gap-2 transition-colors">
                                            <ArrowLeft className="w-4 h-4" /> Voltar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
