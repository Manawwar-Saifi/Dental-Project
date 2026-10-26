import { useQuery } from "@tanstack/react-query";
import { getPatients } from "../api/patients.api";

export const usePatients = (filters) => {
  return useQuery({
    queryKey: ["patients", filters],
    queryFn: () => getPatients(filters),
  });
};