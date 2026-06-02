// Mock localStorage for Node environment
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; }
};
globalThis.localStorage = mockLocalStorage as any;

// Setup test tracking variables
let lastFetchUrl = "";
let lastFetchOptions: any = null;

// Mock the global fetch function to intercept Supabase API requests
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url: string | URL | Request, options?: RequestInit) => {
  const urlStr = url.toString();
  lastFetchUrl = urlStr;
  lastFetchOptions = options;

  console.log(`[MOCK FETCH] Intercepted request to: ${urlStr}`);
  
  // 1. Mock Supabase Auth Sign In request
  if (urlStr.includes('/auth/v1/token')) {
    const body = JSON.parse(options?.body as string || '{}');
    console.log(`[MOCK FETCH] Login Payload Received: Email=${body.email}, Password=${body.password}`);
    
    // Validate that password is correct
    if (body.password === 'correct_password') {
      return new Response(JSON.stringify({
        access_token: 'mocked_jwt_token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mocked_refresh_token',
        user: {
          id: 'a0000000-0000-0000-0000-000000000001',
          email: body.email
        }
      }), { status: 200 });
    } else {
      return new Response(JSON.stringify({
        error: 'invalid_grant',
        error_description: 'Invalid login credentials'
      }), { status: 400 });
    }
  }

  // 2. Mock Supabase Profiles database query
  if (urlStr.includes('/rest/v1/profiles')) {
    console.log(`[MOCK FETCH] Profile Select Query Received`);
    return new Response(JSON.stringify({
      id: 'a0000000-0000-0000-0000-000000000001',
      full_name: 'ศิริชัย เลิศแอดมิน',
      role: 'admin',
      email: 'admin@school.go.th'
    }), { status: 200 });
  }

  return new Response("Not Found", { status: 404 });
};

async function runTests() {
  console.log("\n--- Starting Authentication Integration Tests ---\n");

  // Dynamically import database and supabase modules after mocks are set up
  const { authService } = await import('../../src/lib/db');
  const { hasSupabaseConfig } = await import('../../src/lib/supabase');

  console.log("Supabase config loaded:", hasSupabaseConfig);

  // Test Case 1: Login with correct password
  try {
    console.log("Test Case 1: Attempting login with correct password...");
    const profile = await authService.login('admin@school.go.th', 'correct_password');
    console.log("Test Case 1 Success! Profile returned:", profile);
    console.log("LocalStorage 'sso_current_user':", localStorage.getItem('sso_current_user'));
    
    if (profile.role !== 'admin') {
      throw new Error("Profile role mismatch");
    }
    console.log("Test Case 1 PASSED!\n");
  } catch (err: any) {
    console.error("Test Case 1 FAILED:", err);
    process.exit(1);
  }

  // Test Case 2: Login with incorrect password
  try {
    console.log("Test Case 2: Attempting login with incorrect password...");
    await authService.login('admin@school.go.th', 'wrong_password');
    console.error("Test Case 2 FAILED: Expected login to fail, but it succeeded!");
    process.exit(1);
  } catch (err: any) {
    console.log("Test Case 2 Success! Login failed as expected with message:", err.message);
    console.log("Test Case 2 PASSED!\n");
  }

  // Restore fetch
  globalThis.fetch = originalFetch;
  console.log("--- All Tests Completed Successfully! ---");
}

runTests().catch(err => {
  console.error("Unhandled test error:", err);
  process.exit(1);
});
