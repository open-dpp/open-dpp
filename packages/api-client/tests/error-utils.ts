import { AxiosError } from 'axios'

export async function expectWithDetailedError<T>(
  action: () => Promise<T>,
  expectation: (result: T) => void,
): Promise<void> {
  try {
    const result = await action()
    expectation(result)
  }
  catch (error) {
    if (error instanceof AxiosError && error.response) {
      console.error('Detailed error information:')
      console.error(
        JSON.stringify(
          {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
            requestUrl: error.config?.url,
            requestParams: error.config?.params,
          },
          null,
          2,
        ),
      )
    }
    else {
      console.error('Error without response:', error)
    }

    throw error
  }
}
