<?php

namespace Remachinon\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Remachinon\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MosquittoController extends Controller
{
//    public function __construct()
//    {
//        $this->middleware('ipcheck:localcall');
//    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function getuser(Request $request)
    {
        $request->validate([
            'username'  => ['required','string','email'],
            'password'  => ['required','string']
        ]);
        $credentials = [
            'email'     => request('username'),
            'password'  => request('password')
        ];
        if (!Auth::attempt($credentials)) {
            return response('', 401);
        }
        return response('', 200);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function superuser(Request $request)
    {
        return response('', 401);
    }

    /**
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function aclcheck(Request $request)
    {
        $request->validate([
            'username'  => ['required','string','email'],
            'topic'     => ['required','string'],
        ]);
        $email = request('username');
        list($nil, $muid) = explode('/', request('topic'));
        unset($nil);
        try {
            User::where('email', $email)->firstOrFail()->devices()->where('muid', $muid)->firstOrFail();
        } catch (ModelNotFoundException $e) {
            return response('', 401);
        }
        return response('', 200);
    }
}