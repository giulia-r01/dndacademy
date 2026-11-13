DO $bootstrap$
DECLARE
    target_id bigint := NULL;
    target_username text := '';
    target_email text := '';
    updated_count integer;
BEGIN
    IF target_id IS NULL OR target_id <= 0
       OR btrim(target_username) = '' OR btrim(target_email) = '' THEN
        RAISE EXCEPTION 'Compilare ID, username ed email dell account verificato prima di eseguire lo script.';
    END IF;

    LOCK TABLE public.users IN SHARE ROW EXCLUSIVE MODE;

    IF EXISTS (SELECT 1 FROM public.users WHERE role = 'MASTER') THEN
        RAISE EXCEPTION 'Esiste gia un Master: usare la gestione utenti dell app.';
    END IF;

    UPDATE public.users
    SET role = 'MASTER', token_version = token_version + 1
    WHERE id = target_id
      AND username = target_username
      AND lower(email) = lower(target_email)
      AND role = 'PLAYER';

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    IF updated_count <> 1 THEN
        RAISE EXCEPTION 'Account Player non trovato con ID, username ed email indicati: nessuna modifica applicata.';
    END IF;

    RAISE NOTICE 'Primo Master configurato per account ID %. Accedere nuovamente all app.', target_id;
END
$bootstrap$;
