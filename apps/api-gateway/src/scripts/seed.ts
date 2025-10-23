import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { Faker, pt_BR } from '@faker-js/faker';

dotenv.config();

const faker = new Faker({ locale: [pt_BR] });

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  authorId: string;
  assigneeIds: string[];
  dueDate?: Date;
}

async function seedDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('Conectado ao banco de dados');

    console.log('\nCriando usuários...');
    const users: User[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Alice Silva',
        email: 'alice@example.com',
        password: await hash('password123', 8),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Bruno Costa',
        email: 'bruno@example.com',
        password: await hash('password123', 8),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Carlos Santos',
        email: 'carlos@example.com',
        password: await hash('password123', 8),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'Diana Oliveira',
        email: 'diana@example.com',
        password: await hash('password123', 8),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Eduardo Lima',
        email: 'eduardo@example.com',
        password: await hash('password123', 8),
      },
    ];

    for (const user of users) {
      await dataSource.query(
        `INSERT INTO users (id, name, email, password) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.name, user.email, user.password]
      );
    }
    console.log(`${users.length} usuários criados`);

    console.log('\nCriando tarefas...');
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const statuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    const tasks: Task[] = Array.from({ length: 50 }, (_, index) => {
      const author = users[Math.floor(Math.random() * users.length)];
      const assigneeCount = Math.floor(Math.random() * 3) + 1;
      const assignees = Array.from({ length: assigneeCount }, () => 
        users[Math.floor(Math.random() * users.length)].id
      ).filter((value, index, self) => self.indexOf(value) === index);
      const dueDate = Math.random() > 0.2 ? faker.date.soon({ days: 60 }) : undefined;

      return {
        id: uuidv4(),
        title: faker.lorem.words({ min: 3, max: 6 }),
        description: faker.lorem.paragraph(),
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        authorId: author.id,
        assigneeIds: assignees,
        dueDate,
      };
    });

    for (const task of tasks) {
      await dataSource.query(
        `INSERT INTO tasks (id, title, description, priority, status, author_id, assignee_ids, due_date, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          task.id,
          task.title,
          task.description,
          task.priority,
          task.status,
          task.authorId,
          task.assigneeIds.join(','),
          task.dueDate || null,
        ]
      );
    }
    console.log(`${tasks.length} tarefas criadas`);

    console.log('\nCriando comentários...');
    const comments = [
      {
        taskId: tasks[0].id,
        authorId: users[1].id,
        content: 'Implementação finalizada! Revisei o código e está tudo funcionando perfeitamente.',
      },
      {
        taskId: tasks[0].id,
        authorId: users[0].id,
        content: 'Excelente trabalho! Podemos marcar como concluída.',
      },
      {
        taskId: tasks[1].id,
        authorId: users[2].id,
        content: 'Já comecei a trabalhar nos gráficos principais. Deve ficar pronto até semana que vem.',
      },
      {
        taskId: tasks[1].id,
        authorId: users[0].id,
        content: 'Ótimo! Lembre de usar a biblioteca Recharts que já está no projeto.',
      },
      {
        taskId: tasks[2].id,
        authorId: users[3].id,
        content: 'Identifiquei algumas queries N+1 que precisam ser otimizadas.',
      },
      {
        taskId: tasks[3].id,
        authorId: users[4].id,
        content: 'Swagger configurado e rodando. Preciso apenas validar alguns schemas.',
      },
      {
        taskId: tasks[4].id,
        authorId: users[0].id,
        content: 'Pipeline já está funcionando para desenvolvimento. Falta configurar produção.',
      },
      {
        taskId: tasks[4].id,
        authorId: users[3].id,
        content: 'Posso ajudar com a configuração de produção depois do almoço.',
      },
      {
        taskId: tasks[5].id,
        authorId: users[1].id,
        content: 'WebSocket integrado! Testando notificações em tempo real.',
      },
      {
        taskId: tasks[5].id,
        authorId: users[2].id,
        content: 'Funcionou perfeitamente aqui! 🎉',
      },
    ];

    let commentCount = 0;
    for (const comment of comments) {
      await dataSource.query(
        `INSERT INTO comments (content, author_id, task_id, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [comment.content, comment.authorId, comment.taskId]
      );
      commentCount++;
    }
    console.log(`${commentCount} comentários criados`);

    console.log('\nCriando histórico de tarefas...');
    const histories = [
      {
        taskId: tasks[0].id,
        userId: users[0].id,
        changes: {
          status: { from: 'IN_PROGRESS', to: 'DONE' },
        },
      },
      {
        taskId: tasks[1].id,
        userId: users[0].id,
        changes: {
          status: { from: 'TODO', to: 'IN_PROGRESS' },
          assigneeIds: { from: [], to: [users[2].id] },
        },
      },
      {
        taskId: tasks[3].id,
        userId: users[2].id,
        changes: {
          status: { from: 'IN_PROGRESS', to: 'REVIEW' },
        },
      },
      {
        taskId: tasks[4].id,
        userId: users[3].id,
        changes: {
          priority: { from: 'HIGH', to: 'URGENT' },
        },
      },
      {
        taskId: tasks[5].id,
        userId: users[1].id,
        changes: {
          status: { from: 'TODO', to: 'IN_PROGRESS' },
        },
      },
    ];

    let historyCount = 0;
    for (const history of histories) {
      await dataSource.query(
        `INSERT INTO task_history (task_id, user_id, changes, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [history.taskId, history.userId, JSON.stringify(history.changes)]
      );
      historyCount++;
    }
    console.log(`${historyCount} registros de histórico criados`);

    console.log('\nCriando notificações...');
    const notifications = [
      {
        userId: users[1].id,
        taskId: tasks[0].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[0].title,
          assignedBy: users[0].id,
        },
        isRead: true,
      },
      {
        userId: users[2].id,
        taskId: tasks[1].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[1].title,
          assignedBy: users[0].id,
        },
        isRead: false,
      },
      {
        userId: users[1].id,
        taskId: tasks[2].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[2].title,
          assignedBy: users[1].id,
        },
        isRead: false,
      },
      {
        userId: users[3].id,
        taskId: tasks[2].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[2].title,
          assignedBy: users[1].id,
        },
        isRead: false,
      },
      {
        userId: users[4].id,
        taskId: tasks[3].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[3].title,
          assignedBy: users[2].id,
        },
        isRead: true,
      },
      {
        userId: users[2].id,
        taskId: tasks[3].id,
        type: 'TASK_STATUS_CHANGED',
        data: {
          taskTitle: tasks[3].title,
          previousStatus: 'IN_PROGRESS',
          newStatus: 'REVIEW',
        },
        isRead: false,
      },
      {
        userId: users[0].id,
        taskId: tasks[4].id,
        type: 'TASK_ASSIGNED',
        data: {
          taskTitle: tasks[4].title,
          assignedBy: users[3].id,
        },
        isRead: true,
      },
      {
        userId: users[1].id,
        taskId: tasks[5].id,
        type: 'TASK_COMMENT_ADDED',
        data: {
          taskTitle: tasks[5].title,
          commentAuthor: users[2].id,
          commentPreview: 'Funcionou perfeitamente aqui! 🎉',
        },
        isRead: false,
      },
    ];

    let notificationCount = 0;
    for (const notification of notifications) {
      await dataSource.query(
        `INSERT INTO notifications (user_id, task_id, type, data, is_read, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          notification.userId,
          notification.taskId,
          notification.type,
          JSON.stringify(notification.data),
          notification.isRead,
        ]
      );
      notificationCount++;
    }
    console.log(`${notificationCount} notificações criadas`);

    console.log('\n' + '='.repeat(50));
    console.log('Seed concluído com sucesso!');
    console.log('='.repeat(50));
    console.log(`\nResumo:`);
    console.log(`   • ${users.length} usuários`);
    console.log(`   • ${tasks.length} tarefas`);
    console.log(`   • ${commentCount} comentários`);
    console.log(`   • ${historyCount} históricos`);
    console.log(`   • ${notificationCount} notificações`);
    console.log('\nCredenciais de acesso:');
    console.log('   Email: alice@example.com');
    console.log('   Email: bruno@example.com');
    console.log('   Email: carlos@example.com');
    console.log('   Email: diana@example.com');
    console.log('   Email: eduardo@example.com');
    console.log('   Senha (todos): password123');
    console.log('\n');

  } catch (error) {
    console.error('Erro ao popular o banco:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedDatabase();