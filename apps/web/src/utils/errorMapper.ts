const ERROR_MESSAGES: Record<string, string> = {
  'User with same e-mail address already exists.': 'Usuário com este e-mail já existe.',
  'User credentials do not match.': 'Credenciais inválidas. Verifique seu e-mail e senha.',
  'Invalid refresh token.': 'Sessão expirada. Faça login novamente.',
  'User not found': 'Usuário não encontrado.',
  'Invalid token': 'Token inválido ou expirado.',
  'NetworkError when attempting to fetch resource.': 'Erro de rede. Verifique sua conexão ou tente novamente mais tarde.',

  'Task not found': 'Tarefa não encontrada.',
  'Task not found or unauthorized': 'Tarefa não encontrada ou você não tem permissão para acessá-la.',
  'Unauthorized to update this task': 'Você não tem permissão para editar esta tarefa.',
  'Unauthorized to delete this task': 'Você não tem permissão para deletar esta tarefa.',
  'No changes detected': 'Nenhuma alteração foi detectada.',
  
  'Validation failed': 'Erro de validação. Verifique os dados informados.',
  'Invalid input data': 'Dados inválidos. Verifique as informações fornecidas.',
  'Invalid email format': 'Formato de e-mail inválido.',
  'Password must be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Password must be at least 8 characters': 'A senha deve ter pelo menos 8 caracteres.',
  'Title is required': 'O título é obrigatório.',
  'Description is required': 'A descrição é obrigatória.',
  
  'Network Error': 'Erro de conexão. Verifique sua internet.',
  'Request failed with status code 401': 'Não autorizado. Faça login novamente.',
  'Request failed with status code 403': 'Acesso negado.',
  'Request failed with status code 404': 'Recurso não encontrado.',
  'Request failed with status code 409': 'Conflito. Este recurso já existe.',
  'Request failed with status code 500': 'Erro interno do servidor. Tente novamente mais tarde.',
  'Request failed with status code 502': 'Servidor indisponível no momento.',
  'Request failed with status code 503': 'Serviço temporariamente indisponível.',
  'timeout': 'A requisição demorou muito. Tente novamente.',
  
  'An error occurred': 'Ocorreu um erro. Tente novamente.',
  'Something went wrong': 'Algo deu errado. Tente novamente.',
  'Failed to fetch': 'Falha ao buscar dados. Verifique sua conexão.',
  
  'Unauthorized - No token provided': 'Sessão expirada. Faça login novamente.',
  'Unauthorized - Invalid token': 'Token inválido. Faça login novamente.',
  'WebSocket connection failed': 'Falha ao conectar com o servidor de notificações.',
  
  'Comment not found': 'Comentário não encontrado.',
  'Failed to create comment': 'Erro ao criar comentário. Tente novamente.',
  
  'Failed to fetch task history': 'Erro ao buscar histórico da tarefa.',
  
  'Failed to fetch users': 'Erro ao buscar usuários.',
};

export const mapErrorMessage = (error: any): string => {
  if (!error) {
    return 'Ocorreu um erro desconhecido.';
  }

  let errorMessage = '';

  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  }

  else if (error.response?.data?.error) {
    errorMessage = error.response.data.error;
  }

  else if (error.message) {
    errorMessage = error.message;
  }

  else if (typeof error === 'string') {
    errorMessage = error;
  }

  else if (error.response?.data?.errors) {
    const validationErrors = error.response.data.errors;
    if (Array.isArray(validationErrors)) {
      return validationErrors
        .map((err: any) => {
          if (err.field && err.errors) {
            return `${err.field}: ${err.errors.join(', ')}`;
          }
          return err.message || 'Erro de validação';
        })
        .join('. ');
    }
    return 'Erro de validação. Verifique os dados informados.';
  }

  const translatedMessage = ERROR_MESSAGES[errorMessage];
  
  if (translatedMessage) {
    return translatedMessage;
  }

  const lowerCaseMessage = errorMessage.toLowerCase();
  const partialMatch = Object.keys(ERROR_MESSAGES).find((key) =>
    lowerCaseMessage.includes(key.toLowerCase())
  );

  if (partialMatch) {
    return ERROR_MESSAGES[partialMatch];
  }

  if (errorMessage.includes('status code 401')) {
    return 'Não autorizado. Faça login novamente.';
  }
  if (errorMessage.includes('status code 403')) {
    return 'Acesso negado.';
  }
  if (errorMessage.includes('status code 404')) {
    return 'Recurso não encontrado.';
  }
  if (errorMessage.includes('status code 409')) {
    return 'Conflito. Este recurso já existe.';
  }
  if (errorMessage.includes('status code 500') || errorMessage.includes('Internal Server Error')) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }
  if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet.';
  }
  if (errorMessage.includes('timeout')) {
    return 'A requisição demorou muito. Tente novamente.';
  }

  return errorMessage || 'Ocorreu um erro. Tente novamente.';
};

export const getSuccessMessage = (data: any, defaultMessage: string): string => {
  if (data?.message) {
    const successMessages: Record<string, string> = {
      'Task created': 'Tarefa criada com sucesso!',
      'Task updated': 'Tarefa atualizada com sucesso!',
      'Task deleted': 'Tarefa deletada com sucesso!',
      'Comment created': 'Comentário adicionado com sucesso!',
      'User registered': 'Cadastro realizado com sucesso!',
      'Login successful': 'Login realizado com sucesso!',
    };

    return successMessages[data.message] || defaultMessage;
  }

  return defaultMessage;
};

export const formatValidationErrors = (errors: Record<string, any>): string => {
  const errorMessages = Object.entries(errors)
    .map(([field, error]) => {
      const fieldTranslations: Record<string, string> = {
        email: 'E-mail',
        password: 'Senha',
        confirmPassword: 'Confirmação de senha',
        fullName: 'Nome completo',
        title: 'Título',
        description: 'Descrição',
        dueDate: 'Prazo',
        priority: 'Prioridade',
        status: 'Status',
        content: 'Conteúdo',
      };

      const translatedField = fieldTranslations[field] || field;
      const message = typeof error === 'string' ? error : error.message || 'Inválido';

      return `${translatedField}: ${message}`;
    })
    .join('. ');

  return errorMessages || 'Erro de validação nos campos.';
};