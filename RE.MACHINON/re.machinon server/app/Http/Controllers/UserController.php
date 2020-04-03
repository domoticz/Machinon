<?php

namespace Remachinon\Http\Controllers;

use Remachinon\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Input;

class UserController extends Controller
{
    /**
     * @return \Illuminate\Http\Response
     */
    public function edit(User $user)
    {
        if (empty($user->id)) {
            $user = Auth::user();
        }
        $this->authorize('update', $user);
        return view('users.edit', compact('user'));
    }

    /**
     * @return \Illuminate\Http\Response
     */
    public function update(User $user)
    {
        if (empty($user->id)) {
            $user = Auth::user();
        }
        $this->authorize('update', $user);
        $password_now = Input::get('password_now');
        $rules = [
            'name' => 'required',
            'email' => 'email|required|unique:users,email,' . $user->id,
        ];
        if (!empty($password_now)) {
            if (Hash::check($password_now, $user->password)) {
                $rules = array_merge($rules, [
                    'password_now' => 'required',
                    'password' => 'required|string|min:8|confirmed|different:password_now',
                ]);
            } else {
                $error = \Illuminate\Validation\ValidationException::withMessages([
                    'password_now' => ['Current password is incorrect'],
                ]);
                throw $error;
//                return back()->withErrors('Current password is incorrect')->withInput();
            }
        }
        $this->validate(request(), $rules);
        $user->name = request('name');
        $user->email = request('email');
        $user->password = bcrypt(request('password'));
        $user->save();

        return redirect()->route('devices.index')
            ->with('success', __('Profile edited successfully!'));
    }
}