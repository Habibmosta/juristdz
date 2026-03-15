# 🔍 Guide de Débogage - Événements à venir

## Problème: Les événements ne s'affichent pas

### Étape 1: Vérifier que la table existe

Exécutez dans Supabase SQL Editor:

```sql
-- Vérifier si la table events existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'calendar_events');
```

**Résultat attendu**: Vous devriez voir `events` dans les résultats.

---

### Étape 2: Créer la table si elle n'existe pas

Si la table n'existe pas, exécutez le script:
- Ouvrez `CREER_TABLE_EVENTS.sql`
- Copiez tout le contenu
- Collez dans Supabase SQL Editor
- Exécutez

---

### Étape 3: Vérifier les événements existants

```sql
-- Voir tous vos événements
SELECT * FROM public.events 
WHERE user_id = auth.uid()
ORDER BY event_date;
```

**Si aucun résultat**: Vous n'avez pas encore d'événements. Passez à l'étape 4.

---

### Étape 4: Créer un événement de test

```sql
-- Créer un événement pour demain
INSERT INTO public.events (
  user_id, 
  title, 
  event_date, 
  event_time, 
  event_type, 
  location, 
  description
)
VALUES (
  auth.uid(),
  'Test Audience',
  CURRENT_DATE + 1,
  '09:00',
  'hearing',
  'Tribunal d''Alger',
  'Événement de test'
);

-- Vérifier qu'il a été créé
SELECT * FROM public.events WHERE user_id = auth.uid();
```

---

### Étape 5: Vérifier les politiques RLS

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'events';

-- Voir les politiques
SELECT * FROM pg_policies 
WHERE tablename = 'events';
```

**Résultat attendu**: 
- `rowsecurity` = `true`
- 4 politiques (SELECT, INSERT, UPDATE, DELETE)

---

### Étape 6: Tester la fonction get_upcoming_events

```sql
-- Tester la fonction
SELECT * FROM get_upcoming_events(auth.uid(), 30);
```

**Si erreur "function does not exist"**: La fonction n'a pas été créée. Réexécutez le script `CREER_TABLE_EVENTS.sql`.

---

### Étape 7: Vérifier dans la console du navigateur

1. Ouvrez l'application JuristDZ
2. Ouvrez la console (F12)
3. Cherchez les erreurs liées à "events" ou "upcoming"
4. Notez le message d'erreur exact

---

## Solutions Rapides

### Solution 1: Recréer la table proprement

```sql
-- Supprimer et recréer
DROP TABLE IF EXISTS public.events CASCADE;
```

Puis exécutez `CREER_TABLE_EVENTS.sql` complet.

---

### Solution 2: Migrer depuis calendar_events

Si vous avez des événements dans `calendar_events`:

```sql
-- Copier les événements
INSERT INTO public.events (
  user_id,
  case_id,
  title,
  description,
  event_date,
  event_time,
  event_type,
  location
)
SELECT 
  user_id,
  case_id,
  title,
  description,
  event_date::DATE,
  event_time::TIME,
  event_type,
  location
FROM calendar_events
WHERE user_id = auth.uid();
```

---

### Solution 3: Créer plusieurs événements de test

```sql
-- Événements variés pour tester
INSERT INTO public.events (user_id, title, event_date, event_time, event_type, location)
VALUES 
  (auth.uid(), 'Audience Aujourd''hui', CURRENT_DATE, '09:00', 'hearing', 'Tribunal'),
  (auth.uid(), 'Réunion Demain', CURRENT_DATE + 1, '14:30', 'meeting', 'Cabinet'),
  (auth.uid(), 'Échéance dans 5 jours', CURRENT_DATE + 5, NULL, 'deadline', NULL),
  (auth.uid(), 'Audience dans 1 semaine', CURRENT_DATE + 7, '10:00', 'hearing', 'Cour');

-- Vérifier
SELECT 
  title,
  event_date,
  event_time,
  event_type,
  CASE 
    WHEN event_date = CURRENT_DATE THEN 'AUJOURD''HUI'
    WHEN event_date = CURRENT_DATE + 1 THEN 'DEMAIN'
    ELSE event_date::TEXT
  END as quand
FROM public.events 
WHERE user_id = auth.uid()
ORDER BY event_date;
```

---

## Vérification Finale

Une fois tout configuré, vous devriez voir:

1. ✅ Table `events` existe
2. ✅ Au moins 1 événement dans les 30 prochains jours
3. ✅ Politiques RLS actives
4. ✅ Fonction `get_upcoming_events` existe
5. ✅ Section "Événements à venir" affiche les événements dans l'interface

---

## Besoin d'aide?

Si le problème persiste:
1. Copiez le message d'erreur exact de la console
2. Copiez le résultat de: `SELECT * FROM public.events WHERE user_id = auth.uid();`
3. Vérifiez que vous êtes bien connecté (auth.uid() ne doit pas être NULL)
