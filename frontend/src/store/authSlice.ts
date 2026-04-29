import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { api, setAuthToken } from '../api/client';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading';
  error: string | null;
}

const TOKEN_KEY = 'auth_token';

function readStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

const initialState: AuthState = {
  token: readStoredToken(),
  user: null,
  status: 'idle',
  error: null,
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const token = readStoredToken();
  if (!token) return { token: null as string | null, user: null as AuthUser | null };
  setAuthToken(token);
  const res = await api.get('/users/me');
  const data = res.data as {
    id: string;
    email: string;
    role: string;
  };
  return { token, user: { id: data.id, email: data.email, role: data.role } };
});

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }) => {
    const res = await api.post('/auth/login', payload);
    return res.data as { access_token: string; user: AuthUser };
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const res = await api.post('/auth/register', payload);
    return res.data as { access_token: string; user: AuthUser };
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    },
    setCredentials(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem(TOKEN_KEY, action.payload.token);
      setAuthToken(action.payload.token);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (s) => {
        if (s.token) s.status = 'loading';
        s.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (s, a) => {
        s.status = 'idle';
        s.token = a.payload.token;
        s.user = a.payload.user;
        if (a.payload.token) setAuthToken(a.payload.token);
        else setAuthToken(null);
      })
      .addCase(bootstrapAuth.rejected, (s) => {
        s.status = 'idle';
        s.token = null;
        s.user = null;
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
      })
      .addCase(login.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'idle';
        s.token = a.payload.access_token;
        s.user = a.payload.user;
        localStorage.setItem(TOKEN_KEY, a.payload.access_token);
        setAuthToken(a.payload.access_token);
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'idle';
        s.error = a.error.message ?? 'Login failed';
      })
      .addCase(register.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'idle';
        s.token = a.payload.access_token;
        s.user = a.payload.user;
        localStorage.setItem(TOKEN_KEY, a.payload.access_token);
        setAuthToken(a.payload.access_token);
      })
      .addCase(register.rejected, (s, a) => {
        s.status = 'idle';
        s.error = a.error.message ?? 'Register failed';
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
