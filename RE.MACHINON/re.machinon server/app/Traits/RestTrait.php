<?php

namespace Remachinon\Traits;

use Illuminate\Http\Request;

trait RestTrait
{

    /**
     * Determines if request is an api call.
     *
     * If the request URI contains '/api/v'.
     *
     * @param Request $request
     * @return bool
     */
    protected function isApiCall(Request $request)
    {
        // $request->actAsApi is an attribute I've created to FORCE an action to use
        // API error handlers (eg. DeviceTunnelController::connect())
        return preg_match('/\/api\/v\d/i', $request->getUri()) != false || $request->actAsApi === true;
    }

}
