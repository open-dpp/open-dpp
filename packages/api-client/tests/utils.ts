import { AxiosError } from 'axios'
import { HttpResponse } from 'msw'

function assertQueryParam(
  paramName: string,
  expected: string,
  url: URL,
  errors: string[] = [],
) {
  const received = url.searchParams.get(paramName)
  if (received !== expected) {
    errors.push(
      `Parameter "${paramName}" mismatch:\n`
      + `  Expected: ${expected}\n`
      + `  Received: ${received}`,
    )
  }
}

export function checkQueryParameters(request: any, expectedParams: Record<string, string>) {
  // Check each parameter
  const url = new URL(request.url)
  const errors: string[] = []
  for (const [key, value] of Object.entries(expectedParams)) {
    assertQueryParam(key, value, url, errors)
  }
  if (errors.length > 0) {
    const body = {
      message: 'Query parameters validation failed',
      details: errors,
      receivedUrl: request.url,
      expectedParams,
    }
    console.error('Query parameters validation failed:', body)
    return HttpResponse.json(
      body,
      { status: 500 },
    )
  }
  return undefined
}

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
