# Desafio Full-stack Júnior: Sistema de Gestão de Tarefas Colaborativo

Sistema de gerenciamento de tarefas com arquitetura de microsserviços, notificações em tempo real via WebSocket e interface moderna em React.


## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Decisões Técnicas e Trade-offs](#decisões-técnicas-e-trade-offs)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação e Execução](#instalação-e-execução)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Problemas Conhecidos e Melhorias Futuras](#problemas-conhecidos-e-melhorias-futuras)
- [Tempo de Desenvolvimento](#tempo-de-desenvolvimento)


##  Visão Geral

Sistema de gerenciamento de tarefas com suporte a múltiplos usuários, colaboração em tempo real, histórico de alterações e sistema de notificações. Construído com arquitetura de microsserviços.

### Principais Características

- Autenticação JWT com tokens de acesso e refresh
- CRUD completo de tarefas com filtros e paginação
- Sistema de comentários e histórico de alterações
- Notificações em tempo real via WebSocket
- Atribuição de tarefas a múltiplos usuários
- Interface responsiva
- Logs centralizados com Winston
- Testes unitários e E2E


## Arquitetura

O sistema utiliza arquitetura de microsserviços com comunicação via RabbitMQ e REST API.

Abra a imagem em outra aba para ver melhor os detalhes.

![image](https://raw.githubusercontent.com/VitorHugoAntunes/VitorHugoAntunes-Desafio-Full-stack-Junior/refs/heads/main/assets/diagram.png)

Veja o vídeo de demonstração na pasta assets para ter uma visão do sistema funcionando em tempo real com dois usuários ativos.

### Componentes

1. Frontend (React + Vite)
   - Interface do usuário
   - Cache das requisições com TanStack Query
   - Roteamento de páginas com TanStack Router
   - WebSocket para notificações em tempo real

2. API Gateway (NestJS)
   - Ponto único de entrada
   - Proxy para microsserviços
   - Gateway WebSocket para notificações
   - Autenticação JWT

3. Auth Service (NestJS)
   - Gerenciamento de usuários
   - Autenticação e autorização
   - Geração de tokens JWT (RS256)

4. Tasks Service (NestJS)
   - CRUD de tarefas
   - Comentários
   - Histórico de alterações
   - Estatísticas

5. Notifications Service (NestJS)
   - Criação e gerenciamento de notificações
   - Processamento de eventos (task.created, task.updated, etc.)

6. RabbitMQ
   - Message broker para comunicação assíncrona
   - Filas dedicadas por serviço

7. PostgreSQL
   - Banco de dados relacional
   - Esquema único compartilhado


## Tecnologias Utilizadas

### Backend
- NestJS - Framework Node.js
- TypeScript - Linguagem tipada
- TypeORM - ORM para o banco PostgreSQL
- RabbitMQ - Message broker
- Socket io - WebSocket
- JWT (RS256) - Autenticação
- Winston- Logging
- Vitest - Testes

### Frontend
- React 19 - UI Library
- TypeScript - Linguagem tipada
- Vite - Ferramenta de build
- TanStack Query - Cache de requisições
- TanStack Router - Roteamento
- Tailwind CSS - Estilização
- Shadcn/ui - Componentes visuais
- Socket io Client - WebSocket
- React Hook Form + Zod - Validação de formulários
- Vitest - Testes

### Infraestrutura
- Docker & Docker Compose - Containerização
- Yarn Workspaces com Turborepo - Monorepo

## Decisões Técnicas e Trade-offs

### 1. Arquitetura de Microsserviços

Decisão: Separar o sistema em microsserviços independentes (Auth, Tasks, Notifications).

Justificativa:
- Escalabilidade independente de cada serviço
- Separação de responsabilidades clara

Trade-offs:
- Maior complexidade operacional
- Necessidade de message broker
- Maior latência na comunicação entre serviços

### 2. RabbitMQ para Comunicação

Decisão: Utilizar RabbitMQ para comunicação assíncrona entre microsserviços.

Justificativa:
- Desacoplamento entre serviços
- Garantia de entrega de mensagens

Trade-offs:
- Dependência adicional (RabbitMQ)
- Complexidade no gerenciamento de filas
- Curva de aprendizado

### 3. JWT com RS256 (Chaves Assimétricas)

Decisão: Usar RS256 ao invés de HS256 para assinatura de tokens.

Justificativa:
- Maior segurança (chave privada apenas no Auth Service)
- Validação de tokens sem comunicação com Auth Service
- Padrão recomendado para microsserviços

Trade-offs:
- Performance levemente inferior ao HS256
- Gerenciamento de chaves públicas e privadas

### 4. PostgreSQL com Esquema Único

Decisão: Usar banco de dados compartilhado com esquema único ao invés de bancos separados.

Justificativa:
- Simplicidade operacional para projeto de demonstração localhost
- Facilita backup e recovery

Trade-offs:
- Acoplamento no nível de dados
- Dificuldade para escalar serviços independentemente
- Não é tão ideal para produção em larga escala

### 5. WebSocket para Notificações

Decisão: Implementar notificações em tempo real via WebSocket.

Justificativa:
- Experiência do usuário melhorada (notificações instantâneas)
- Reduzir requisições http desnecessárias

Trade-offs:
- Complexidade adicional no backend e frontend
- Gerenciamento de conexões persistentes

### 6. TanStack Query

Decisão: Usar TanStack Query para cache de requisições http.

Justificativa:
- Gerenciamento automático de cache
- Revalidação inteligente
- Otimizado para requisições assíncronas

Trade-offs:
- Dependência de biblioteca externa
- Curva de aprendizado inicial

### 7. Monorepo com Yarn Workspaces e Turborepo

Decisão: Estruturar o projeto como monorepo.

Justificativa:
- Compartilhamento de código (logger package)
- Versionamento unificado
- Desenvolvimento sincronizado

Trade-offs:
- Builds mais lentos
- Gerenciamento de dependências mais complexo
- Tamanho do repositório

### 8. Vitest ao invés de Jest

Decisão: Usar Vitest para testes.

Justificativa:
- Melhor integração com Vite
- Performance superior
- API compatível com Jest

Trade-offs:
- Algumas libs podem ter problemas de compatibilidade


## Funcionalidades

### Autenticação
- [x] Registro de usuários
- [x] Login com JWT
- [x] Refresh token automático
- [x] Logout
- [x] Proteção de rotas

### Tarefas
- [x] Criar, editar, deletar tarefas
- [x] Listar tarefas com paginação
- [x] Filtros (status, prioridade, busca)
- [x] Atribuir tarefas a múltiplos usuários
- [x] Definir prazo, prioridade e status
- [x] Visualização detalhada de tarefa

### Comentários
- [x] Adicionar comentários em tarefas
- [x] Listar comentários com paginação
- [x] Identificação do autor do comentário

### Histórico
- [x] Registro automático de alterações
- [x] Visualização de histórico por tarefa
- [x] Tracking de mudanças de status, prioridade, etc.

### Notificações
- [x] Notificações em tempo real
- [x] Notificação de atribuição de tarefa
- [x] Notificação de mudança de status
- [x] Notificação de novo comentário
- [x] Marcar como lida
- [x] Marcar todas como lidas
- [x] Contador de não lidas

### Interface
- [x] Design responsiva
- [x] Componentes acessíveis (Shadcn/ui)
- [x] Loading states
- [x] Error handling
- [x] Notificações Toast

---

## Pré-requisitos

- **Node.js** 20.x ou superior
- **Yarn** 1.22.x ou superior
- **Docker** e **Docker Compose** (para desenvolvimento com containers)
- **PostgreSQL** 16.x (se rodar sem Docker)
- **Dbeaver** ou outra ferramenta semelhante (para se conectar e visualizar as tabelas do banco sem Docker)


## Instalação e Execução
### Opção 1: Docker

1. Clone o repositório
```bash
git clone 
cd VitorHugoAntunes-Desafio-Full-stack-Junior-main
```

2. Configure as variáveis de ambiente
   
Já pré configurado, os arquivos ```.env.example``` estão preenchidos com valores padrão para acelerar o processo, mas você pode alterar os valores como desejar.

4. chaves JWT (RSA)
   
Também já estão disponibilizadas nos arquivos de variáveis ambientes. Como este projeto não está deployado em nenhuma nuvem e rodará apenas localmente, não tem problema cada git clone compartilhar as mesmas chaves privadas e públicas, mas caso deseje gerar suas próprias chaves, siga as instruções:
```bash
openssl genrsa -out private_key.pem 2048

openssl rsa -in private_key.pem -pubout -out public_key.pem

# Converter para base64 (necessário para .env)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("private_key.pem")) > private_key_base64.txt
[Convert]::ToBase64String([IO.File]::ReadAllBytes("public_key.pem")) > public_key_base64.txt
```
Lembrando que estes comandos são para ambiente Windows com powershell, para Linux e MacOS muda de acordo com seu sistema.

4. Configure as variáveis de ambiente

Adicione as chaves base64 nos arquivos `.env`:
- `JWT_PRIVATE_KEY=<base64-private-key>`
- `JWT_PUBLIC_KEY=<base64-public-key>`

5. Suba os containers
```bash
docker-compose build --no-cache
docker-compose up -d
```

6. Execute as migrations
   
As migrations já foram geradas, basta rodar o comando de run para aplicar ao seu banco no docker.
```bash
yarn install
yarn migration:run
```

7. Acesse a aplicação
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3333
- Swagger Docs: http://localhost:3333/api/docs
- Health checks: http://localhost:3333/health

### Opção 2: Desenvolvimento Local

1. **Instale as dependências**
```bash
yarn install
```

2. **Configure PostgreSQL e RabbitMQ**
```bash
yarn docker:dev
```
Este comando vai subir no docker uma instância Postgres e outra RabbitMQ para desenvolvimento.

3. **Configure as variáveis de ambiente** (igual aos passos da Opção 1)

4. **Execute os serviços**
Na raiz do monorepo:
```bash
yarn migration:run
yarn dev
```

### Seed de Dados (Opcional)

Para popular o banco com dados de exemplo:
```bash
# Local
# Na raiz do monorepo
yarn db:seed

# Caso deseje limpar o banco
yarn db:clear 
```

**Credenciais de teste:**
- Email: `alice@example.com` | Senha: `password123`
- Email: `bruno@example.com` | Senha: `password123`
- Email: `carlos@example.com` | Senha: `password123`
- Email: `diana@example.com` | Senha: `password123`
- Email: `eduardo@example.com` | Senha: `password123`


## Estrutura do Projeto
```
VitorHugoAntunes-Desafio-Full-stack-Junior-main/
├── apps/
│   ├── api-gateway/          # Gateway e proxy para microserviços
│   ├── auth-service/         # Serviço de autenticação
│   ├── tasks-service/        # Serviço de tarefas
│   ├── notifications-service/# Serviço de notificações
│   └── web/                  # Frontend React
├── packages/
│   ├── logger/               # Logger compartilhado (Winston)
│   └── typescript-config/    # Configurações TypeScript
├── docker-compose.yml        # containers
├── package.json              
└── README.md
```
Existem outros arquivos que você pode alterar conforme seu desejo, como o ```turbo.json``` com configurações do monorepo e os o arquivo ```client.http``` dentro de ```apps/api-gateway``` semelhante às collections do Postman para testar os endpoints sem necessidade de uma interface.

### Estrutura de cada Microserviço
```
service/
├── src/
│   ├── modules/              
│   │   ├── service/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   └── dtos/
│   ├── app.module.ts               
│   └── main.ts               # Entry point
├── test/                     # Testes E2E
├── Dockerfile
└── package.json
```
É uma estrutura padrão que eu segui, mas cada microsserviço contém diferenças significativas, conforme o necessário para cada um funcionar, este guia é apenas de exemplo.


## Testes

### Executar Testes Unitários
```bash
# Todos os serviços
# na raiz do monorepo
yarn test

# Serviço específico
cd apps/auth-service
yarn test
```

### Executar Testes E2E
```bash
# Todos os servicos
# na raiz do monorepo
yarn test:e2e

# API Gateway
cd apps/api-gateway
yarn test:e2e

# Serviço específico
cd apps/auth-service
yarn test:e2e
```

O frontend também contém testes unitários.


## Problemas Conhecidos e Melhorias Futuras

### Problemas Conhecidos

1. Banco de Dados Compartilhado
   - Todos os microsserviços usam o mesmo banco PostgreSQL
   - Impacto: Acoplamento no nível de dados
   - Solução futura: Migrar para bancos separados por serviço


### Melhorias Futuras

#### Curto Prazo
- [ ] Implementar busca full-text nas tarefas
- [ ] Adicionar upload de anexos em tarefas
- [ ] Adicionar testes de carga (k6)

#### Médio Prazo
- [ ] Implementar cache com Redis
- [ ] Adicionar observabilidade (Grafana)
- [ ] Implementar CI/CD completo (GitHub Actions)

#### Longo Prazo
- [ ] Adicionar serviço de analytics
- [ ] Deploy dos microsserviços e frontend

### Segurança
- [ ] Implementar HTTPS
- [ ] Adicionar proteção CSRF

### Performance
- [ ] Otimizar bundle size do frontend

## ⏱️ Tempo de Desenvolvimento

### Estimativa por Fase

| Fase | Tempo Estimado | Descrição |
|------|----------------|-----------|
| Setup Inicial | 4h | Configuração do monorepo, Docker, estrutura base |
| Auth Service | 8h | Implementação completa de autenticação com JWT |
| Tasks Service | 10h | CRUD de tarefas, comentários, histórico |
| Notifications Service | 10h | Sistema de notificações e eventos |
| API Gateway | 6h | Proxy, WebSocket gateway, integração |
| Frontend - Base | 4h | Setup, autenticação, rotas protegidas |
| Frontend - Tarefas | 6h | CRUD, filtros, paginação, formulários |
| Frontend - Notificações | 6h | WebSocket, UI de notificações |
| Frontend - Incrementos | 4h | Responsividade, loading states, error handling |
| Testes | 8h | Testes unitários e E2E |
| DevOps | 6h | Docker Compose e scripts|
| Documentação | 4h | README e Swagger |
| Debug | 8h | Correção de bugs, refinamentos |

## Referências e Recursos

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Turborepo](https://turborepo.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Autenticação centralizada em microsserviços NestJS](https://www.youtube.com/watch?v=iiSTB0btEgA)
- [Tutorial de Microservices com Nest.js em 20 Minutos](https://www.youtube.com/watch?v=C250DCwS81Q)
- [Stackoverflow](https://stackoverflow.com/questions)
- [Comunidade Nestjs](https://www.reddit.com/r/nestjs/)


##  Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/suaFeature`)
3. Commit suas mudanças (`git commit -m 'Add some suaFeature'`)
4. Push para a branch (`git push origin feature/suaFeature`)
5. Abra um Pull Request


## Licença

Este projeto é licenciado - veja o arquivo [LICENSE](LICENSE) para detalhes.
