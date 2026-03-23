INSERT INTO instance_features (instance_id, feature_key, enabled)
SELECT id, 'ai_analyst', true FROM instances WHERE slug = 'demo'
ON CONFLICT DO NOTHING;
