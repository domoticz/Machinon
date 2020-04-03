<?php

namespace Remachinon\Http\Controllers;

use Remachinon\Models\User;
use Remachinon\Models\DeviceTunnel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function signup(Request $request)
    {
        $request->validate([
            'name'     => ['required','string'],
            'email'    => ['required','string','email','unique:users'],
            'password' => ['required','string','confirmed'],
        ]);
        $user = new User([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
        ]);
        $user->save();
        return response()->json([
            'status'        => 'success',
            'response_body' => null,
            'message'       => 'Successfully created user'
        ], 201);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'       => ['required','string','email'],
            'password'    => ['required','string'],
            'remember_me' => ['boolean'],
            'tunnel_uuid' => ['uuid'],
        ]);
        $credentials = request(['email', 'password']);
        if (!Auth::attempt($credentials)) {
            return response()->json([
                'status'        => 'failure',
                'response_body' => null,
                'message'       => 'Unauthorized'
            ], 401);
        }
        $user = $request->user();
        // If the login comes with a device tunnel UUID
        // Let's check if the user can access that device.
        if (!empty($request->tunnel_uuid)) {
            $device_tunnel = DeviceTunnel::join(
                'devices', 'devices.id', '=', 'device_tunnels.device_id')
                ->where('uuid', $request->tunnel_uuid)
                ->where('device_tunnels.is_enabled', 1)
                ->where('user_id', $user->id)
                ->first();
            if (!$device_tunnel) {
                return response()->json([
                    'status'        => 'failure',
                    'response_body' => null,
                    'message'       => 'Unauthorized'
                ], 401);
            }
        }
        // Everything okay, let's update the token and return it
        $tokenResult = $user->createToken('Personal Access Token');
        $token = $tokenResult->token;
        if ($request->remember_me) {
            $token->expires_at = Carbon::now()->addWeeks(1);
        }
        $token->save();
        return response()->json([
            'status'        => 'success',
            'response_body' => null,
            'access_token'  => $tokenResult->accessToken,
            'token_type'    => 'Bearer',
            'expires_at'    => Carbon::parse(
                $tokenResult->token->expires_at)
                ->toDateTimeString(),
            'message'       => 'Successfully logged in',
        ]);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->token()->revoke();
        return response()->json([
            'status'        => 'success',
            'response_body' => null,
            'message'       => 'Successfully logged out'
        ]);
    }
}