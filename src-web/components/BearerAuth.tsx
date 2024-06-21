import { useUpdateAnyGrpcRequest } from '../hooks/useUpdateAnyGrpcRequest';
import { useUpdateAnyHttpRequest } from '../hooks/useUpdateAnyHttpRequest';
import type { GrpcRequest, HttpRequest } from '../lib/models';
import { Input } from './core/Input';
import { VStack } from './core/Stacks';

interface Props<T> {
  request: T;
}

export function BearerAuth<T extends HttpRequest | GrpcRequest>({ request }: Props<T>) {
  const updateHttpRequest = useUpdateAnyHttpRequest();
  const updateGrpcRequest = useUpdateAnyGrpcRequest();

  return (
    <VStack className="my-2" space={2}>
      <Input
        useTemplating
        autocompleteVariables
        placeholder="token"
        type="password"
        label="Token"
        name="token"
        size="sm"
        defaultValue={`${request.authentication.token}`}
        onChange={(token: string) => {
          if (request.model === 'http_request') {
            updateHttpRequest.mutate({
              id: request.id ?? null,
              update: (r) => ({
                ...r,
                authentication: { token },
              }),
            });
          } else {
            updateGrpcRequest.mutate({
              id: request.id ?? null,
              update: (r) => ({
                ...r,
                authentication: { token },
              }),
            });
          }
        }}
      />
    </VStack>
  );
}
