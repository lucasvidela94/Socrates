import { useState, useEffect } from "react";

export const useParams = () => {
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      const [path, queryString] = hash.split("?");
      
      const pathParts = path.split("/");
      const id = pathParts[pathParts.length - 1];
      
      const queryParams: Record<string, string> = {};
      if (queryString) {
        queryString.split("&").forEach((param) => {
          const [key, value] = param.split("=");
          if (key) {
            queryParams[key] = decodeURIComponent(value || "");
          }
        });
      }

      setParams({
        id: id ?? "",
        ...queryParams
      });
    };

    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, []);

  return params;
};