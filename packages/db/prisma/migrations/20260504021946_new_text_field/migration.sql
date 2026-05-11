-- Convert TEXT columns to JSONB in place, preserving existing values by
-- wrapping them in a Tiptap/ProseMirror doc:
--   { "type": "doc", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": <value> } ] } ] }
--
-- Idempotent: each column is only altered if it is still TEXT in the current
-- schema (handles cases where a previous failed run partially converted some
-- columns to JSONB before erroring out).
--
-- NULL stays NULL on nullable columns. NULL/empty become an empty Tiptap doc
-- on NOT NULL columns so existing rows satisfy the constraint.

DO $$
DECLARE
    -- (schema, table, column, is_not_null)
    targets text[][] := ARRAY[
        ARRAY['public', 'businesses',     'defaultNotes', 'false'],
        ARRAY['public', 'businesses',     'defaultTerms', 'false'],
        ARRAY['public', 'estimate_items', 'description',  'true' ],
        ARRAY['public', 'estimates',      'notes',        'false'],
        ARRAY['public', 'estimates',      'terms',        'false'],
        ARRAY['public', 'estimates',      'summary',      'false'],
        ARRAY['public', 'invoice_items',  'description',  'true' ],
        ARRAY['public', 'invoices',       'notes',        'false'],
        ARRAY['public', 'invoices',       'terms',        'false']
    ];
    target text[];
    current_type text;
    sql text;
BEGIN
    FOREACH target SLICE 1 IN ARRAY targets LOOP
        SELECT data_type INTO current_type
        FROM information_schema.columns
        WHERE table_schema = target[1]
          AND table_name   = target[2]
          AND column_name  = target[3];

        IF current_type IS NULL THEN
            RAISE NOTICE 'Skipping %.% — column not found', target[2], target[3];
            CONTINUE;
        END IF;

        IF current_type = 'jsonb' THEN
            RAISE NOTICE 'Skipping %.% — already jsonb', target[2], target[3];
            CONTINUE;
        END IF;

        IF current_type <> 'text' THEN
            RAISE EXCEPTION 'Unexpected type % for %.%', current_type, target[2], target[3];
        END IF;

        IF target[4] = 'true' THEN
            sql := format($f$
                ALTER TABLE %I.%I
                ALTER COLUMN %I TYPE JSONB
                USING CASE
                    WHEN %I IS NULL OR %I = '' THEN
                        '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
                    ELSE jsonb_build_object(
                        'type', 'doc',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'paragraph',
                                'content', jsonb_build_array(
                                    jsonb_build_object('type', 'text', 'text', %I)
                                )
                            )
                        )
                    )
                END
            $f$, target[1], target[2], target[3], target[3], target[3], target[3]);
        ELSE
            sql := format($f$
                ALTER TABLE %I.%I
                ALTER COLUMN %I TYPE JSONB
                USING CASE
                    WHEN %I IS NULL OR %I = '' THEN NULL
                    ELSE jsonb_build_object(
                        'type', 'doc',
                        'content', jsonb_build_array(
                            jsonb_build_object(
                                'type', 'paragraph',
                                'content', jsonb_build_array(
                                    jsonb_build_object('type', 'text', 'text', %I)
                                )
                            )
                        )
                    )
                END
            $f$, target[1], target[2], target[3], target[3], target[3], target[3]);
        END IF;

        RAISE NOTICE 'Converting %.% from text to jsonb', target[2], target[3];
        EXECUTE sql;
    END LOOP;
END
$$;
