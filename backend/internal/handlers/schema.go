package handlers

const Schema = `
	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		me: User
		getUsers(teamId: ID!): [User!]!
		getTeams: [Team!]!
		getTeam(id: ID!): Team
		getColumns(teamId: ID!): [Column!]!
		getTasks(teamId: ID!): [Task!]!
		getTask(id: ID!): Task
		getNotifications: [Notification!]!
		getTaskActivities(taskId: ID!): [TaskActivity!]!
	}

	type Mutation {
		register(email: String!, username: String!, password: String!): AuthPayload!
		login(email: String!, password: String!): AuthPayload!
		createTeam(name: String!, description: String): Team!
		addTeamMember(teamId: ID!, userId: ID!, role: String): TeamMember!
		removeTeamMember(teamId: ID!, userId: ID!): Boolean!
		createTask(input: CreateTaskInput!): Task!
		updateTask(input: UpdateTaskInput!): Task!
		deleteTask(id: ID!): Boolean!
		moveTask(taskId: ID!, columnId: ID!, position: Int!): Task!
		assignTask(taskId: ID!, assigneeId: ID!): Task!
		markNotificationRead(id: ID!): Boolean!
		markAllNotificationsRead: Boolean!
	}

	input CreateTaskInput {
		teamId: ID!
		columnId: ID!
		title: String!
		description: String
		priority: String
		assigneeId: ID
		deadline: String
		tags: [String!]
	}

	input UpdateTaskInput {
		id: ID!
		title: String
		description: String
		priority: String
		assigneeId: ID
		deadline: String
		tags: [String!]
	}

	type AuthPayload {
		token: String!
		user: User!
	}

	type User {
		id: ID!
		email: String!
		username: String!
		avatarUrl: String!
		createdAt: String!
	}

	type Team {
		id: ID!
		name: String!
		description: String!
		ownerId: ID!
		members: [TeamMember!]!
		columns: [Column!]!
		createdAt: String!
	}

	type TeamMember {
		id: ID!
		teamId: ID!
		userId: ID!
		role: String!
		user: User!
		joinedAt: String!
	}

	type Column {
		id: ID!
		teamId: ID!
		name: String!
		color: String!
		position: Int!
		tasks: [Task!]!
	}

	type Task {
		id: ID!
		teamId: ID!
		columnId: ID!
		title: String!
		description: String!
		priority: String!
		assigneeId: ID
		assignee: User
		creatorId: ID!
		creator: User
		deadline: String
		position: Int!
		tags: [String!]!
		createdAt: String!
		updatedAt: String!
	}

	type Notification {
		id: ID!
		userId: ID!
		type: String!
		title: String!
		message: String!
		taskId: ID
		read: Boolean!
		createdAt: String!
	}

	type TaskActivity {
		id: ID!
		taskId: ID!
		userId: ID!
		user: User
		action: String!
		details: String!
		createdAt: String!
	}
`
