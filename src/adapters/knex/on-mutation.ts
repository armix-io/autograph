import { Adapter } from "../../types/adapter";
import { QueryTransport as KnexQueryTransport } from "./transports";
import { UseQuery } from "./use-query";
import { UseMutation } from "./use-mutation";

export type Options = {
  useQuery: UseQuery;
  useMutation: UseMutation;
};

export const onMutation = ({
  useQuery,
  useMutation,
}: Options): Adapter<KnexQueryTransport>["onMutation"] => async (mutation) => {
  const id = await useMutation(mutation);

  if (id) {
    const {
      items: [item],
    } = await useQuery({
      name: mutation.name,
      context: mutation.context,
      id: id.toString(),
    });
    return item;
  }

  return undefined;
};
