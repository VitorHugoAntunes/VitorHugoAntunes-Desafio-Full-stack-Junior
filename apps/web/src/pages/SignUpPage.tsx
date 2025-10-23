import { useState } from "react";
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, ListTodo, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, type SignUpFormData } from "@/schemas/signup-schema";
import { useToastHandler } from "@/hooks/useToastHandler";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register: authRegister } = useAuth();
  const { showSuccess, showError } = useToastHandler();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreedToTerms: false,
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const registerMutation = useMutation({
    mutationFn: async (data: SignUpFormData) => {
      await authRegister(data.fullName, data.email, data.password);
    },
    onSuccess: () => {
      showSuccess("Cadastro realizado com sucesso! Bem-vindo!");
      navigate({ to: '/home' });
    },
    onError: (error: any) => {
      showError(error);
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    registerMutation.mutate(data);
  };
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;


  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 bg-blue-600 rounded-xl">
              <ListTodo className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Criar sua conta</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2 px-4">Comece a gerenciar suas tarefas hoje mesmo</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="fullName" className="text-sm sm:text-base text-gray-700 font-medium">
                Nome Completo
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="João Silva"
                {...register("fullName")}
                disabled={isSubmitting || registerMutation.isPending}
                className="h-10 sm:h-11 bg-gray-50 border-gray-200 text-sm sm:text-base"
              />
              {errors.fullName && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base text-gray-700 font-medium">
                Endereço de Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@example.com"
                {...register("email")}
                disabled={isSubmitting || registerMutation.isPending}
                className="h-10 sm:h-11 bg-gray-50 border-gray-200 text-sm sm:text-base"
              />
              {errors.email && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">
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
                  placeholder="Crie uma senha forte"
                  {...register("password")}
                  disabled={isSubmitting || registerMutation.isPending}
                  className="h-10 sm:h-11 bg-gray-50 border-gray-200 pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                  disabled={isSubmitting || registerMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  {errors.password.message}
                </p>
              )}
              {password && (
                <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg space-y-1.5 sm:space-y-2">
                  <p className="text-xs font-medium text-gray-700">
                    Requisitos de senha:
                  </p>
                  <div className="space-y-1">
                    {[
                      {
                        label: "Pelo menos 8 caracteres",
                        met: passwordRequirements.minLength,
                      },
                      {
                        label: "Uma letra maiúscula",
                        met: passwordRequirements.hasUpperCase,
                      },
                      {
                        label: "Uma letra minúscula",
                        met: passwordRequirements.hasLowerCase,
                      },
                      {
                        label: "Um número",
                        met: passwordRequirements.hasNumber,
                      },
                    ].map((req) => (
                      <div
                        key={req.label}
                        className="flex items-center gap-2 text-xs"
                      >
                        <div
                          className={`${
                            req.met ? "text-green-600" : "text-gray-300"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span
                          className={req.met ? "text-green-700" : "text-gray-500"}
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm sm:text-base text-gray-700 font-medium"
              >
                Confirmar Senha
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  {...register("confirmPassword")}
                  disabled={isSubmitting || registerMutation.isPending}
                  className="h-10 sm:h-11 bg-gray-50 border-gray-200 pr-10 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 touch-manipulation"
                  disabled={isSubmitting || registerMutation.isPending}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs sm:text-sm text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
              {confirmPassword && passwordsMatch && !errors.confirmPassword && (
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  As senhas correspondem
                </p>
              )}
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <input
                type="checkbox"
                id="terms"
                {...register("agreedToTerms")}
                disabled={isSubmitting || registerMutation.isPending}
                className="mt-0.5 sm:mt-1 h-4 w-4 rounded border-gray-300 shrink-0"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Concordo com os{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                  Termos de Serviço
                </a>{" "}
                e{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                  Política de Privacidade
                </a>
              </label>
            </div>
            {errors.agreedToTerms && (
              <p className="text-xs sm:text-sm text-red-600 mt-1">
                {errors.agreedToTerms.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || registerMutation.isPending}
              className="w-full h-10 sm:h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-3 sm:mt-4 text-sm sm:text-base touch-manipulation"
            >
              {(isSubmitting || registerMutation.isPending) ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando conta...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar
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
              Já tem uma conta?{" "}
              <Link
                to={"/signin"}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
              >
                Entrar
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