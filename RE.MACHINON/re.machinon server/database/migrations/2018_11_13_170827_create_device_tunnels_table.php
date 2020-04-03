<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateDeviceTunnelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('device_tunnels', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('device_id');
            $table->foreign('device_id')->references('id')->on('devices')
                ->onDelete('cascade');
            // Stores tunnel URL hash, the reverse SSH port and tunnel status
            $table->uuid('uuid')->unique()->nullable();
            $table->unsignedSmallInteger('port')->unique()->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tunnels');
    }
}
