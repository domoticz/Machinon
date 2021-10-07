<?php

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Generates a default user
        Remachinon\Models\User::create([
            'name' => 'Jose Garcia',
            'email' => 'test@machinon.com',
            'password' => bcrypt('secret'),
        ]);
    }
}
