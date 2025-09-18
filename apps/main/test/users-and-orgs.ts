import { Organization } from '../src/organizations/domain/organization';
import { User } from '../src/users/domain/user';
import { randomUUID } from 'crypto';

// Keycloak user objects (plain objects with user data)
const user1org1 = {
  id: 'user1org1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  emailVerified: true,
  username: 'johndoe',
};

const user2org1 = {
  id: 'user2org1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  emailVerified: true,
  username: 'janesmith',
};

const user1org2 = {
  id: 'user1org2',
  firstName: 'Bob',
  lastName: 'Johnson',
  email: 'bob@example.com',
  emailVerified: true,
  username: 'bobjohnson',
};

const user2org2 = {
  id: 'user2org2',
  firstName: 'Alice',
  lastName: 'Williams',
  email: 'alice@example.com',
  emailVerified: true,
  username: 'alicewilliams',
};

const user1org3 = {
  id: 'user1org3',
  firstName: 'Charlie',
  lastName: 'Brown',
  email: 'charlie@example.com',
  emailVerified: true,
  username: 'charliebrown',
};

// Array of all keycloak users
const keycloakUsers = [user1org1, user2org1, user1org2, user2org2, user1org3];

// User domain objects
const userObj1 = new User(user1org1.id, user1org1.email);
const userObj2 = new User(user2org1.id, user2org1.email);
const userObj3 = new User(user1org2.id, user1org2.email);
const userObj4 = new User(user2org2.id, user2org2.email);
const userObj5 = new User(user1org3.id, user1org3.email);

// Organization domain objects
const org1 = Organization.fromPlain({
  id: 'org1',
  name: 'Organization 1',
  members: [userObj1, userObj2],
  createdByUserId: user1org1.id,
  ownedByUserId: user1org1.id,
});

const org2 = Organization.fromPlain({
  id: 'org2',
  name: 'Organization 2',
  members: [userObj3, userObj4],
  createdByUserId: user1org2.id,
  ownedByUserId: user1org2.id,
});

const org3 = Organization.fromPlain({
  id: 'org3',
  name: 'Organization 3',
  members: [userObj5],
  createdByUserId: user1org3.id,
  ownedByUserId: user1org3.id,
});

// Array of all organizations
const organizations = [org1, org2, org3];

// Function to create a random user for tests that need unique users
const createRandomUser = () => {
  const id = randomUUID();
  return new User(id, `${id}@example.com`);
};

export {
  keycloakUsers,
  organizations,
  org1,
  org2,
  org3,
  user1org1,
  user2org1,
  user1org2,
  user2org2,
  user1org3,
  userObj1,
  userObj2,
  userObj3,
  userObj4,
  userObj5,
  createRandomUser,
};
