import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';
const demoPassword = process.env.SUPABASE_DEMO_PASSWORD || 'password123';

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL (or VITE_SUPABASE_URL).');
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const demoUsers = [
  {
    email: 'admin@school.go.th',
    full_name: 'Sirichai Admin',
    role: 'admin',
    phone: '081-234-5678',
    department_code: 'general'
  },
  {
    email: 'director@school.go.th',
    full_name: 'Dr. Somchai',
    role: 'director',
    phone: '089-876-5432',
    department_code: 'general'
  },
  {
    email: 'registrar@school.go.th',
    full_name: 'Napaporn',
    role: 'registrar',
    phone: '086-543-2109',
    department_code: 'acad'
  },
  {
    email: 'teacher@school.go.th',
    full_name: 'Manas',
    role: 'teacher',
    phone: '084-321-0987',
    department_code: 'acad'
  },
  {
    email: 'staff@school.go.th',
    full_name: 'Somsri',
    role: 'general_staff',
    phone: '085-456-7890',
    department_code: 'general'
  }
];

const loadDepartments = async () => {
  const { data, error } = await supabase.from('departments').select('id, code');
  if (error) {
    throw new Error(`Failed to load departments: ${error.message}`);
  }

  return new Map((data || []).map((department) => [department.code, department.id]));
};

const loadAuthUsers = async () => {
  const usersByEmail = new Map();
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    for (const user of data.users) {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), user);
      }
    }

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return usersByEmail;
};

const upsertProfile = async ({ user, seed, departmentId }) => {
  const timestamp = new Date().toISOString();
  const profilePayload = {
    id: user.id,
    full_name: seed.full_name,
    role: seed.role,
    department_id: departmentId,
    phone: seed.phone,
    avatar_url: '',
    email: seed.email
  };

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileLookupError) {
    throw new Error(`Failed to inspect profile for ${seed.email}: ${profileLookupError.message}`);
  }

  if (existingProfile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...profilePayload,
        updated_at: timestamp
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update profile for ${seed.email}: ${updateError.message}`);
    }
    return 'updated';
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    ...profilePayload,
    created_at: timestamp,
    updated_at: timestamp
  });

  if (insertError) {
    throw new Error(`Failed to create profile for ${seed.email}: ${insertError.message}`);
  }

  return 'created';
};

const main = async () => {
  console.log('Seeding demo auth users...');

  const departmentsByCode = await loadDepartments();
  const authUsersByEmail = await loadAuthUsers();

  let createdCount = 0;
  let updatedCount = 0;

  for (const seed of demoUsers) {
    const metadata = {
      full_name: seed.full_name,
      role: seed.role,
      phone: seed.phone,
      avatar_url: ''
    };

    const existingUser = authUsersByEmail.get(seed.email.toLowerCase());
    let user = existingUser;

    if (user) {
      const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
        password: demoPassword,
        email_confirm: true,
        user_metadata: metadata
      });

      if (error || !data.user) {
        throw new Error(`Failed to update auth user for ${seed.email}: ${error?.message || 'Unknown error'}`);
      }

      user = data.user;
      updatedCount += 1;
      console.log(`Updated auth user: ${seed.email}`);
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: seed.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: metadata
      });

      if (error || !data.user) {
        throw new Error(`Failed to create auth user for ${seed.email}: ${error?.message || 'Unknown error'}`);
      }

      user = data.user;
      createdCount += 1;
      console.log(`Created auth user: ${seed.email}`);
    }

    authUsersByEmail.set(seed.email.toLowerCase(), user);

    const departmentId = departmentsByCode.get(seed.department_code);
    if (!departmentId) {
      throw new Error(`Missing department code "${seed.department_code}" for ${seed.email}.`);
    }

    const profileAction = await upsertProfile({
      user,
      seed,
      departmentId
    });

    console.log(`Profile ${profileAction}: ${seed.email}`);
  }

  console.log(`Done. Created ${createdCount}, updated ${updatedCount}.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
