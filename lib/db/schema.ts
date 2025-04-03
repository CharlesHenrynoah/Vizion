import { pgTable, serial, varchar, text, timestamp, boolean, integer, pgEnum, relations } from 'drizzle-orm/pg-core';
import { InferSelectModel } from 'drizzle-orm';

// Enum pour les rôles des membres du projet
export const roleEnum = pgEnum('role', ['owner', 'admin', 'member', 'viewer']);

// Enum pour les priorités des tickets
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'urgent']);

// Table utilisateurs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  avatar: text('avatar'),
  profilePhoto: text('profile_photo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull()
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tickets: many(tickets, { relationName: 'assignedTickets' }),
  createdTickets: many(tickets, { relationName: 'createdTickets' }),
  memberProjects: many(projectMembers),
  comments: many(ticketComments)
}));

// Table projets
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull(), 
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  color: varchar('color', { length: 20 }).default('#3b82f6'),
  icon: varchar('icon', { length: 50 }).default('clipboard')
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id]
  }),
  tickets: many(tickets),
  members: many(projectMembers)
}));

// Table statuts de tickets
export const ticketStatuses = pgTable('ticket_statuses', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 20 }).notNull(),
  position: integer('position').default(0).notNull()
});

export const ticketStatusesRelations = relations(ticketStatuses, ({ many }) => ({
  tickets: many(tickets)
}));

// Table tickets
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  projectId: integer('project_id').notNull(),
  statusId: integer('status_id').notNull(),
  assignedTo: text('assigned_to'), 
  createdBy: text('created_by').notNull(), 
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  priority: integer('priority').default(0),
  position: integer('position').default(0),
  tags: text('tags').array(),
  attachments: text('attachments').array(),
  isSubTicket: boolean('is_sub_ticket').default(false),
  parentTicketId: integer('parent_ticket_id'), 
  subTicketsCount: integer('sub_tickets_count').default(0)
});

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, {
    fields: [tickets.projectId],
    references: [projects.id]
  }),
  status: one(ticketStatuses, {
    fields: [tickets.statusId],
    references: [ticketStatuses.id]
  }),
  assignedUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
    relationName: 'assignedTickets'
  }),
  creator: one(users, {
    fields: [tickets.createdBy],
    references: [users.id],
    relationName: 'createdTickets'
  }),
  parentTicket: one(tickets, {
    fields: [tickets.parentTicketId],
    references: [tickets.id]
  }),
  subTickets: many(tickets, {
    relationName: 'parentTicket'
  }),
  comments: many(ticketComments)
}));

// Table membres du projet
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull(),
  userId: text('user_id').notNull(), 
  role: varchar('role', { length: 50 }).notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id]
  })
}));

// Table commentaires de tickets
export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  ticketId: integer('ticket_id').notNull(),
  userId: text('user_id').notNull(), 
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  attachments: text('attachments').array()
});

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id]
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id]
  })
}));

// Types pour meilleure inférence
export type User = InferSelectModel<typeof users>;
export type Project = InferSelectModel<typeof projects>;
export type TicketStatus = InferSelectModel<typeof ticketStatuses>;
export type Ticket = InferSelectModel<typeof tickets>;
export type ProjectMember = InferSelectModel<typeof projectMembers>;
export type TicketComment = InferSelectModel<typeof ticketComments>;
