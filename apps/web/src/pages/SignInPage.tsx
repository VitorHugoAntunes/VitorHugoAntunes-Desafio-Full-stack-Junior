import { useState } from "react";
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ListTodo, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToastHandler } from "@/hooks/useToastHandler";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, type SignInFormData } from "@/schemas/signin-schema";

export default function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToastHandler();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: SignInFormData) => {
      await login(data.email, data.password);
    },
    onSuccess: () => {
      showSuccess('Olá, bem vindo!');
      navigate({ to: '/home' });
    },
    onError: (error: any) => {
      showError(error);
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 bg-blue-600 rounded-xl">
              <ListTodo className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Entrar na sua conta</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 px-4">Bem-vindo de volta</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base text-gray-700 font-medium">
                Endereço de Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@example.com"
                {...register("email")}
                disabled={isSubmitting || loginMutation.isPending}
                className="h-10 sm:h-11 bg-gray-50 border-gray-200 text-sm sm:text-base"
              />
              {errors.email && (
                <p className="text-xs sm:text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base text-gray-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  {...register("password")}
                  disabled={isSubmitting || loginMutation.isPending}
                  className="h-10 sm:h-11 bg-gray-50 border-gray-200 pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                  disabled={isSubmitting || loginMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs sm:text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium touch-manipulation"
              >
                Esqueceu a senha?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm sm:text-base touch-manipulation"
            >
              {(isSubmitting || loginMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Entrar
                </div>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-5 sm:my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs sm:text-sm text-gray-500">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-600">
              Não tem uma conta?{" "}
              <Link
                to={"/signup"}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4 sm:mt-6 text-xs sm:text-sm text-gray-600 px-4">
          <p>© 2025 Gestão de Tarefas. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}