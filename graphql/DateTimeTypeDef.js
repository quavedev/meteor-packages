export const DateTimeTypeDef = `
  scalar DateTime
  
  type Now {
    dateTime: DateTime
  }
  
  type Query {
    now: Now
  }
`;
