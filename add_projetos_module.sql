-- Add 'projetos' module to global_module_settings to appear in "Controle de Acesso"
INSERT INTO public.global_module_settings (module_key, label, is_enabled, parent_key, order_index, description)
VALUES 
    ('parent_projetos', 'Módulo: Projetos', true, null, 100, 'Gestão e acompanhamento de projetos municipais')
ON CONFLICT (module_key) DO UPDATE SET label = EXCLUDED.label;
