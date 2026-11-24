'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  updateProfileSchema,
  updatePasswordSchema,
  setPasswordSchema,
  type UpdateProfileInput,
  type UpdatePasswordInput,
  type SetPasswordInput,
} from '@/lib/validations/profile';

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  hasPassword: boolean;
  providers: string[];
}

const MAX_IMAGE_BYTES = 500 * 1024;
const MAX_DIMENSION = 256;

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'U';
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

async function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

async function loadProfile(): Promise<ProfileData> {
  const res = await fetch('/api/account/profile');
  if (!res.ok) throw new Error();
  return (await res.json()) as ProfileData;
}

export function AccountSettings() {
  const { update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await loadProfile();
      setProfile(data);
    } catch {
      toast.error('Erro ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadProfile()
      .then((data) => { if (active) setProfile(data); })
      .catch(() => toast.error('Erro ao carregar perfil.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Não foi possível carregar suas informações.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AvatarSection
        profile={profile}
        onUpdated={async (image) => {
          setProfile({ ...profile, image });
          await update({ user: { image } });
        }}
      />
      <ProfileSection
        profile={profile}
        onUpdated={async (data) => {
          setProfile({ ...profile, ...data });
          await update({ user: data });
        }}
      />
      <PasswordSection profile={profile} onUpdated={refresh} />
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-7">
        <header className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
        </header>
        <div className="mt-6">{children}</div>
      </CardContent>
    </Card>
  );
}

function AvatarSection({
  profile,
  onUpdated,
}: {
  profile: ProfileData;
  onUpdated: (image: string | null) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      toast.error('Use uma imagem PNG, JPG ou WEBP.');
      return;
    }

    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      if (dataUrl.length > MAX_IMAGE_BYTES) {
        toast.error('Imagem muito grande mesmo após redimensionar.');
        return;
      }
      const res = await fetch('/api/account/image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao atualizar foto.');
        return;
      }
      await onUpdated(data.image);
      toast.success('Foto atualizada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/account/image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Erro ao remover foto.');
        return;
      }
      await onUpdated(null);
      toast.success('Foto removida.');
    } catch {
      toast.error('Erro ao remover foto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard
      icon={<Camera className="h-5 w-5" aria-hidden="true" />}
      title="Foto de perfil"
      description="A imagem aparece no topo da aplicação e nas notificações."
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20 ring-2 ring-border ring-offset-2 ring-offset-background">
          {profile.image ? (
            <AvatarImage src={profile.image} alt={profile.name ?? profile.email} />
          ) : null}
          <AvatarFallback className="bg-primary/15 text-base font-semibold text-primary">
            {getInitials(profile.name, profile.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={handleFile}
            aria-label="Selecionar nova foto"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePick}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {profile.image ? 'Trocar foto' : 'Enviar foto'}
            </Button>
            {profile.image && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={busy}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG ou WEBP · redimensionada automaticamente para 256px.
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

function ProfileSection({
  profile,
  onUpdated,
}: {
  profile: ProfileData;
  onUpdated: (data: { name?: string; email?: string }) => void | Promise<void>;
}) {
  const uid = useId();
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: profile.name ?? '', email: profile.email },
  });

  useEffect(() => {
    form.reset({ name: profile.name ?? '', email: profile.email });
  }, [profile.name, profile.email, form]);

  const submit = async (values: UpdateProfileInput) => {
    const payload: { name?: string; email?: string } = {};
    if (values.name !== undefined && values.name !== (profile.name ?? '')) payload.name = values.name;
    if (values.email !== undefined && values.email !== profile.email) payload.email = values.email;

    if (!payload.name && !payload.email) {
      toast.info('Nenhuma alteração para salvar.');
      return;
    }

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao atualizar perfil.');
        return;
      }
      await onUpdated({ name: data.name ?? undefined, email: data.email });
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <SectionCard
      icon={<UserIcon className="h-5 w-5" aria-hidden="true" />}
      title="Informações pessoais"
      description="Atualize seu nome e email de acesso."
    >
      <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-name`}>Nome</Label>
          <Input
            id={`${uid}-name`}
            type="text"
            autoComplete="name"
            aria-invalid={!!form.formState.errors.name}
            aria-describedby={form.formState.errors.name ? `${uid}-name-error` : undefined}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p id={`${uid}-name-error`} role="alert" className="text-xs font-medium text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-email`}>
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Email
            </span>
          </Label>
          <Input
            id={`${uid}-email`}
            type="email"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? `${uid}-email-error` : undefined}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p id={`${uid}-email-error`} role="alert" className="text-xs font-medium text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
          {profile.providers.includes('google') && (
            <p className="text-xs text-muted-foreground">
              Sua conta também está vinculada ao Google. Alterar o email aqui não desfaz o vínculo.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting} aria-busy={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando...</>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  errorId?: string;
}
function PasswordField({ id, errorId, ...props }: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        aria-describedby={errorId}
        className="pr-10"
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={show}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

function PasswordSection({
  profile,
  onUpdated,
}: {
  profile: ProfileData;
  onUpdated: () => void | Promise<void>;
}) {
  const uid = useId();
  const hasPassword = profile.hasPassword;

  const updateForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const setForm = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onUpdate = async (values: UpdatePasswordInput) => {
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao atualizar senha.');
        return;
      }
      toast.success('Senha atualizada!');
      updateForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await onUpdated();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  };

  const onSet = async (values: SetPasswordInput) => {
    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao definir senha.');
        return;
      }
      toast.success('Senha criada! Agora você pode entrar com email + senha.');
      setForm.reset({ newPassword: '', confirmPassword: '' });
      await onUpdated();
    } catch {
      toast.error('Erro de conexão. Tente novamente.');
    }
  };

  if (!hasPassword) {
    return (
      <SectionCard
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        title="Criar senha"
        description="Sua conta hoje só faz login com Google. Defina uma senha para também poder entrar com email."
      >
        <form onSubmit={setForm.handleSubmit(onSet)} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-new`}>Nova senha</Label>
            <PasswordField
              id={`${uid}-new`}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              errorId={setForm.formState.errors.newPassword ? `${uid}-new-error` : undefined}
              aria-invalid={!!setForm.formState.errors.newPassword}
              {...setForm.register('newPassword')}
            />
            {setForm.formState.errors.newPassword && (
              <p id={`${uid}-new-error`} role="alert" className="text-xs font-medium text-destructive">
                {setForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-confirm`}>Confirmar nova senha</Label>
            <PasswordField
              id={`${uid}-confirm`}
              autoComplete="new-password"
              placeholder="Repita a senha"
              errorId={setForm.formState.errors.confirmPassword ? `${uid}-confirm-error` : undefined}
              aria-invalid={!!setForm.formState.errors.confirmPassword}
              {...setForm.register('confirmPassword')}
            />
            {setForm.formState.errors.confirmPassword && (
              <p id={`${uid}-confirm-error`} role="alert" className="text-xs font-medium text-destructive">
                {setForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={setForm.formState.isSubmitting} aria-busy={setForm.formState.isSubmitting}>
              {setForm.formState.isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Definindo...</>
              ) : (
                'Definir senha'
              )}
            </Button>
          </div>
        </form>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      icon={<KeyRound className="h-5 w-5" aria-hidden="true" />}
      title="Alterar senha"
      description="Para sua segurança, confirme a senha atual antes de definir uma nova."
    >
      <form onSubmit={updateForm.handleSubmit(onUpdate)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-current`}>Senha atual</Label>
          <PasswordField
            id={`${uid}-current`}
            autoComplete="current-password"
            placeholder="Sua senha atual"
            errorId={updateForm.formState.errors.currentPassword ? `${uid}-current-error` : undefined}
            aria-invalid={!!updateForm.formState.errors.currentPassword}
            {...updateForm.register('currentPassword')}
          />
          {updateForm.formState.errors.currentPassword && (
            <p id={`${uid}-current-error`} role="alert" className="text-xs font-medium text-destructive">
              {updateForm.formState.errors.currentPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-new`}>Nova senha</Label>
          <PasswordField
            id={`${uid}-new`}
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            errorId={updateForm.formState.errors.newPassword ? `${uid}-new-error` : undefined}
            aria-invalid={!!updateForm.formState.errors.newPassword}
            {...updateForm.register('newPassword')}
          />
          {updateForm.formState.errors.newPassword && (
            <p id={`${uid}-new-error`} role="alert" className="text-xs font-medium text-destructive">
              {updateForm.formState.errors.newPassword.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-confirm`}>Confirmar nova senha</Label>
          <PasswordField
            id={`${uid}-confirm`}
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            errorId={updateForm.formState.errors.confirmPassword ? `${uid}-confirm-error` : undefined}
            aria-invalid={!!updateForm.formState.errors.confirmPassword}
            {...updateForm.register('confirmPassword')}
          />
          {updateForm.formState.errors.confirmPassword && (
            <p id={`${uid}-confirm-error`} role="alert" className="text-xs font-medium text-destructive">
              {updateForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={updateForm.formState.isSubmitting} aria-busy={updateForm.formState.isSubmitting}>
            {updateForm.formState.isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando...</>
            ) : (
              'Atualizar senha'
            )}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}
