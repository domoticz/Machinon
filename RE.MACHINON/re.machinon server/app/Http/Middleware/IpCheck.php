<?php

namespace Remachinon\Http\Middleware;

use Closure;

class IpCheck
{
    /**
     * @param $request
     * @param Closure $next
     * @param bool $localonly
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Routing\Redirector|mixed
     *
     * You can use this middleware with .env variable IP lists OR
     * if you pass the middleware variable:
     *         $this->middleware('ipcheck:localonly');
     * it will just check the URl has been called from the server itself.
     */
    public function handle($request, Closure $next, $filter)
    {
        $server_ip = $request->server('SERVER_ADDR');
        $client_ip = $request->ip();
        switch($filter) {
            case 'localcall': // Call must be done from own server itself
                if ($client_ip != $server_ip) {
                    return abort(401);
                }
                break;
            case 'registration': // Call must be done from IP on registraition whitelist at .env
            default:
                $whitelist = explode(',', config('app.allow_registry_from'));
                if (in_array($client_ip, $whitelist, true)) {
                    return $next($request);
                }
                // Try to find whitelisted wildcarded IPs
                foreach ($whitelist as $i) {
                    $wildcardPos = strpos($i, "*");
                    if ($wildcardPos !== false && substr($client_ip, 0, $wildcardPos) . "*" === $i) {
                        return $next($request);
                    }
                }
                // IP not allowed to register, redirect to home...
                return redirect('login')->with('info', 'Sorry, user registrations are temporarily closed.');
                break;
        }
        return $next($request);
    }
}