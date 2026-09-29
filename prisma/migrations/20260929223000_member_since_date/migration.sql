-- Lid sinds wordt een datum. Een bestaand jaartal wordt 1 januari van dat jaar.
ALTER TABLE "Member"
  ALTER COLUMN "memberSince" TYPE DATE
  USING (
    CASE
      WHEN "memberSince" IS NULL THEN NULL
      ELSE make_date("memberSince", 1, 1)
    END
  );
