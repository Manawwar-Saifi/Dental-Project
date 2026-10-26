import { useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();

  console.error(error);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
      <pre>
        {error?.statusText || error?.message}
      </pre>
    </div>
  );
};

export default ErrorPage;
