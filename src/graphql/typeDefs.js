export const typeDefs = `#graphql
    type User{
        _id: ID!,
        name:String!,
        email:String!,
        avatar:String
    }

    type Post {
        _id: ID!
        content: String!
        imageUrl: String
        createdAt: String!
        # Notice we define author as a full User object, not just an ID string!
        author: User! 
        # A computed field that doesn't natively exist on the Post document
        commentCount: Int! 
    }
    
    type Query {
        post(id:ID!):Post,
        posts:[Post!]!
    }
`;
