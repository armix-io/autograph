import omit from "lodash.omit";
import { Node } from "./types/graph";
import { Resolver } from "./types/resolver";
import { Adapter } from "./types/adapter";
import { ModelAny } from "./model/model";
import { buildTypeDefs } from "./graph/build-typedefs";
import { buildResolvers } from "./graph/build-resolvers";
import {
  mergeTypeDefs,
  mergeResolvers,
  wrapResolvers,
} from "./graph/graph-utils";

type Options = {
  models: ModelAny[];
  adapter: Adapter;
  typeDefs?: Partial<Record<Node, string>>;
  resolvers?: Partial<Record<Node, Record<string, any>>>;
  wrapper?: (resolver: Resolver) => Resolver;
  wrapperExcludes?: Partial<Record<Exclude<Node, "root">, string[]>>;
};

export class Autograph {
  typeDefs: string;
  resolvers: Record<"Query" | "Mutation", Record<string, Resolver>>;

  constructor(options: Options) {
    const {
      models,
      adapter,
      typeDefs,
      resolvers,
      wrapper,
      wrapperExcludes,
    } = options;

    const modelsTypeDefs = models.map((model) => buildTypeDefs(model));
    const modelsResolvers = models.map((model) =>
      buildResolvers(model, adapter)
    );

    this.typeDefs = `
      ${typeDefs?.root || ""}
      ${mergeTypeDefs(modelsTypeDefs)}
      type Query {
        ${typeDefs?.query || ""}
        ${mergeTypeDefs(modelsTypeDefs, "query")}
      }
      type Mutation {
        ${typeDefs?.mutation || ""}
        ${mergeTypeDefs(modelsTypeDefs, "mutation")}
      }
    `;

    const rootResolvers = {
      ...(resolvers?.root || {}),
      ...mergeResolvers(modelsResolvers),
    };
    const queryResolvers = {
      ...(resolvers?.query || {}),
      ...mergeResolvers(modelsResolvers, "query"),
    };
    const mutationResolvers = {
      ...(resolvers?.mutation || {}),
      ...mergeResolvers(modelsResolvers, "mutation"),
    };

    this.resolvers = {
      ...rootResolvers,
      Query: {
        ...queryResolvers,
        ...(wrapper
          ? wrapResolvers(
              omit(queryResolvers, wrapperExcludes?.query || []),
              wrapper
            )
          : {}),
      },
      Mutation: {
        ...mutationResolvers,
        ...(wrapper
          ? wrapResolvers(
              omit(mutationResolvers, wrapperExcludes?.mutation || []),
              wrapper
            )
          : {}),
      },
    };
  }
}
