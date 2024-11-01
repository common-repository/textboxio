<?php
class TextboxSettingsPage
{
    /**
     * Holds the values to be used in the fields callbacks
     */
    private $options;
    private $stamp_plugin_path;
    /**
     * Start up
     */
    public function __construct($file)
    {
        add_action( 'admin_menu', array( $this, 'add_plugin_page' ) );
        add_action( 'admin_init', array( $this, 'page_init' ) );
        $this->stamp_plugin_path = $file;
    }

    function our_plugin_action_links($links, $file) {    
        // check to make sure we are on the correct plugin
        if (basename($file) == basename($this->stamp_plugin_path)) {
            // the anchor tag and href to the URL we want. For a "Settings" link, this needs to be the url of your settings page
            $settings_link = '<a href="' . get_bloginfo('wpurl') . '/wp-admin/options-general.php?page=tbio-admin">Settings</a>';
            // add the link to the list
            array_unshift($links, $settings_link);
        }
        return $links;
    }

    /**
     * Add options page
     */
    public function add_plugin_page()
    {
        // This page will be under "Settings"
        add_options_page(
            'Settings Admin', 
            'Textbox.io', 
            'manage_options', 
            'tbio-admin', 
            array( $this, 'create_admin_page' )
        );
        add_filter('plugin_action_links', array( $this, 'our_plugin_action_links'), 10, 2);
    }



    /**
     * Options page callback
     */
    public function create_admin_page()
    {
        // Set class property
        $this->options = get_option( 'tbio_settings' );

        ?>
        <div class="wrap">
            <?php screen_icon(); ?>
            <h2>Textbox.io settings</h2>           
            <form method="post" action="options.php">
            <?php
                // This prints out all hidden setting fields
                settings_fields( 'textbox_io' );   
                do_settings_sections( 'tbio-admin' );
                submit_button(); 
            ?>
            </form>
        </div>
        <?php
    }

    /**
     * Register and add settings
     */
    public function page_init()
    {        
        register_setting(
            'textbox_io', // Option group
            'tbio_settings', // Option name
            array( $this, 'sanitize' ) // Sanitize
        );

        add_settings_section(
            'setting_section_id', // ID
            'General Settings', // Title
            array( $this, null), // Callback
            'tbio-admin' // Page
        );  

        add_settings_field(
            'api_key', // ID
            'API Key', // Title 
            array( $this, 'render_api_key' ), // Callback
            'tbio-admin', // Page
            'setting_section_id' // Section           
        );      
   
    }

    /**
     * Sanitize each setting field as needed
     *
     * @param array $input Contains all settings fields as array keys
     */
    public function sanitize( $input )
    {
        //TODO: ensure input is ok

        return $input;
    }

    /** 
     * Print the Section text
     */
    public function print_section_info()
    {
        print '';
    }

    /** 
     * Get the settings option array and print one of its values
     */
    public function render_api_key()
    {
        $output = '<input type="text" id="api_key" name="tbio_settings[api_key]" value="'
         . esc_attr( $this->options['api_key']) 
         . '"/>';
         if($this->options['api_key'] == null || $this->options['api_key'] == '')
            $output .= '<a href="https://developers.textbox.io/wordpress/activate" target="_blank">[Get an API key]</a>';
        printf('%s', $output);
        
    }

}?>
