import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  return value && !value.startsWith('--') ? value : undefined;
}

async function main() {
  const email = flag('email');
  const password = flag('password');
  const fullName = flag('name');
  const role = flag('role') === 'admin' ? 'admin' : 'seller';

  if (!email || !password || !fullName) {
    throw new Error(
      'Usage: npm run seller:create -- --email a@b.c --password "********" --name "Ada" [--role admin|seller]',
    );
  }

  if (password.length < 8) {
    throw new Error('Le mot de passe doit faire au moins 8 caractères.');
  }

  const { createServiceClient } = await import('../src/lib/supabase/service');
  const supabase = createServiceClient();

  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId = created.data.user?.id;

  if (created.error || !userId) {
    const listed = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listed.error) {
      throw created.error ?? listed.error;
    }
    const existing = listed.data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!existing) {
      throw created.error ?? new Error('Impossible de créer ou de retrouver l’utilisateur.');
    }
    userId = existing.id;
  }

  const { error: sellerError } = await supabase.from('sellers').upsert({
    id: userId,
    full_name: fullName,
    role,
  });

  if (sellerError) {
    throw sellerError;
  }

  process.stdout.write(`Vendeur prêt : ${fullName} (${role}) — ${email}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
