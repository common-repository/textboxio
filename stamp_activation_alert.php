<?php
class TextboxActivationAlert
{

    public function __construct()
    {
        add_action('admin_notices', $c = create_function('', 'echo "' . addcslashes($this->getActivationNotice(),'"') . '";')); 
    }

    private function getActivationNotice(){
        $msg = '<div class="error ephox-wp-activation-container">'
                  .'<input type="submit" value="Activate Textbox.io" class="ephox-wp-activation-submit-button"/>'
                    .'<span class="headline">Say hello to powerful editing.</span>'
                    .'<span class="headline"><strong>Activate Textbox.io</strong> for your WordPress site.</span>'
                .'</div>'
                .'<script type="text/javascript">'
                .'jQuery(".ephox-wp-activation-submit-button").click(function(){'
                  .'window.open("https://developers.textbox.io/wordpress/activate#domains&addDomain=" + window.location.host,"_blank");'
                .'});'
                .'</script>';
        return $msg;
    }


}

?>
