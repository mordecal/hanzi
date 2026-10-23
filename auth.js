// Общие функции авторизации. Подключается после supabase-config.js.

async function signUp(email, password, firstName, lastName) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName } },
  });
  return { data, error };
}
async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  return { data, error };
}

async function signOut() {
  await sb.auth.signOut();
}

async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

// Возвращает профиль текущего пользователя (включая role) или null
async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Не удалось загрузить профиль:', error.message);
    return null;
  }
  return data;
}

// Вызывать на страницах, куда нельзя без логина (index.html).
// Возвращает профиль, если всё ок, иначе null (и показывает форму входа снаружи).
async function requireAuth() {
  const session = await getSession();
  return session ? getCurrentProfile() : null;
}

// Вызывать на admin.html — если не админ, отправляем обратно на главную.
async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    window.location.href = 'index.html';
    return null;
  }
  return profile;
}
