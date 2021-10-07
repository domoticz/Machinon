<?php

namespace MachinonAuth;

require_once __DIR__ . '/../config/config.php';

session_start();

?>
<html>
<head>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css"
          integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
    <style>
        body {
            padding-top: 40px;
            padding-bottom: 40px;
            background-color: #eee;
        }

        .form-signin {
            max-width: 330px;
            padding: 15px;
            margin: 0 auto;
        }
        .form-signin .form-signin-heading,
        .form-signin .checkbox {
            margin-bottom: 10px;
        }
        .form-signin .checkbox {
            font-weight: normal;
        }
        .form-signin .form-control {
            position: relative;
            height: auto;
            -webkit-box-sizing: border-box;
            -moz-box-sizing: border-box;
            box-sizing: border-box;
            padding: 10px;
            font-size: 16px;
        }
        .form-signin .form-control:focus {
            z-index: 2;
        }
        .form-signin input[type="email"] {
            margin-bottom: -1px;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 0;
        }
        .form-signin input[type="password"] {
            margin-bottom: 10px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="row">
            <div class="col-sm-4"></div>
            <div class="col-sm-4 text-center">
                    <p><img src="http://re.machinon.com/images/machinon_logo.png" alt="Machinon" style="width:175px"/></p>
            </div>
            <div class="col-sm-4"></div>
        </div>
        <hr/>
        <div class="row">
            <div class="col-sm-4"></div>
            <div class="col-sm-4 text-center">
                <?php if (!isset($_SESSION['credentials'])) : ?>
                <form class="form-signin" method="POST" action="auth.php">
                    <div class="alert alert-danger" role="alert" style="display:none">Login error</div>
                    <div class="alert alert-success" role="alert" style="display:none">Login complete, please wait...</div>
                    <h2 class="form-signin-heading">Please Login</h2>
                    <div class="input-group">
                        <span class="input-group-addon" id="basic-addon1">@</span>
                        <input type="text" name="username" class="form-control" placeholder="Email" required>
                    </div>
                    <label for="inputPassword" class="sr-only">Password</label>
                    <input type="password" name="password" id="inputPassword" class="form-control" placeholder="Password" required>
                    <button class="btn btn-lg btn-primary btn-block" type="submit">Login</button>
                </form>
                <?php else: ?>
                    <a class="btn btn-lg btn-primary btn-block" href="machinon/">Domoticz</a>
                    <a class="btn btn-lg btn-primary btn-block" href="./?f=main">Machinon setup</a>
                    <a class="btn btn-lg btn-primary btn-block" href="logout.php">Logout</a>
                <?php endif; ?>
            </div>
            <div class="col-sm-4"></div>
        </div>
    </div>

<script src="https://code.jquery.com/jquery-3.3.1.min.js"
        integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
        integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa"
        crossorigin="anonymous"></script>

<script>
    $(document).ready(function() {
        $('form.form-signin').submit(function (e) {
            e.preventDefault();
            $('div.alert-danger').hide();
            $('div.alert-success').hide();
            $('button.btn-lg').prop('disabled', true);
            $.ajax({
                url: $('form.form-signin').attr("action"),
                type: 'POST',
                data: $('form.form-signin').serialize(),
                success: function() {
                    $('div.alert-success').show();
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                },
                error: function() {
                    $('div.alert-danger').show();
                    $('button.btn-lg').prop('disabled', false);
                }
            });
        });
    });
</script>
</body>
</html>