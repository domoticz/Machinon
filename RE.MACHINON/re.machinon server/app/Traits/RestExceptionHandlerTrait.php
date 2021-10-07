<?php

namespace Remachinon\Traits;

use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

trait RestExceptionHandlerTrait
{

    /**
     * Creates a new JSON response based on exception type.
     *
     * @param Request $request
     * @param Exception $e
     * @return \Illuminate\Http\JsonResponse
     */
    protected function getJsonResponseForException(Request $request, Exception $e)
    {
        switch(true) {
            case $this->isModelNotFoundException($e):
                $retval = $this->modelNotFound();
                break;
            case $this->isAuthorizationException($e);
            case $this->isAccessDeniedHttpException($e):
                $retval = $this->unauthorizedRequest();
                break;
            case $this->isValidationException($e):
                $retval = $this->wrongAttributes();
                break;
            default:
                $retval = $this->badRequest();
        }

        return $retval;
    }

    /**
     * Returns json response when received parameter's validation fail
     *
     * @param string $message
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function wrongAttributes($message='Wrong parameters', $statusCode=400)
    {
        return $this->jsonResponse([
            'status' => 'failure',
            'response_body' => 'ER.',
            'message' => $message,
        ], $statusCode);
    }

    /**
     * Returns json response for an unauthorized request (policies)
     *
     * @param string $message
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function unauthorizedRequest($message='Unauthorized', $statusCode=401)
    {
        return $this->jsonResponse([
            'status' => 'failure',
            'response_body' => 'ER.',
            'message' => $message,
        ], $statusCode);
    }

    /**
     * Returns json response for generic bad request.
     *
     * @param string $message
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function badRequest($message='Bad request', $statusCode=400)
    {
        return $this->jsonResponse([
            'status' => 'failure',
            'response_body' => 'ER.',
            'message' => $message,
        ], $statusCode);
    }

    /**
     * Returns json response for Eloquent model not found exception.
     *
     * @param string $message
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function modelNotFound($message='Record not found', $statusCode=404)
    {
        return $this->jsonResponse([
            'status' => 'failure',
            'response_body' => 'ER.',
            'message' => $message,
        ], $statusCode);
    }

    /**
     * Returns json response.
     *
     * @param array|null $payload
     * @param int $statusCode
     * @return \Illuminate\Http\JsonResponse
     */
    protected function jsonResponse(array $payload=null, $statusCode=404)
    {
        $payload = $payload ?: [];

        return response()->json($payload, $statusCode);
    }

    /**
     * Determines if the given exception is an Eloquent model not found.
     *
     * @param Exception $e
     * @return bool
     */
    protected function isModelNotFoundException(Exception $e)
    {
        return $e instanceof ModelNotFoundException;
    }

    /**
     * Determines if the given exception is an authorization error
     *
     * @param Exception $e
     * @return bool
     */
    protected function isAccessDeniedHttpException(Exception $e)
    {
        return $e instanceof AccessDeniedHttpException;
    }

    /**
     * Determines if the given exception is a Policy rule failure
     *
     * @param Exception $e
     * @return bool
     */
    protected function isAuthorizationException(Exception $e)
    {
        return $e instanceof AuthorizationException;
    }

    /**
     * Determines if the given exception is an Eloquent model validation error.
     *
     * @param Exception $e
     * @return bool
     */
    protected function isValidationException(Exception $e)
    {
        return $e instanceof ValidationException;
    }

}