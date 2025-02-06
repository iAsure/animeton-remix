import { useState } from 'react';
import { API_BASE_URL } from '@constants/config';

const useDiscordTicket = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTicket = async (userId: string, details: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const logContent = await window.api.log.getContent();

      const response = await fetch(`${API_BASE_URL}/discord/ticket`, {
        method: 'POST',
        body: JSON.stringify({
          userId,
          details,
          logContent
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || `HTTP error! status: ${response.status}`
        );
      }

      setData(result);
      return result;
    } catch (error) {
      setError(error.message);
      console.error('Error creating discord ticket:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return { createTicket, data, isLoading, error, resetData };
};

export default useDiscordTicket;
