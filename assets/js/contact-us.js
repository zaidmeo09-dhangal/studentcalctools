(() => {
    'use strict';

    const form = document.getElementById(
        'contact-form'
    );

    if (!form) {
        return;
    }

    window.formspree =
        window.formspree ||
        function () {
            (
                window.formspree.q =
                    window.formspree.q || []
            ).push(arguments);
        };

    window.formspree(
        'initForm',
        {
            formElement:
                '#contact-form',

            formId:
                'mbdnvpqz',

            onSuccess:
                function (context) {
                    const submittedForm =
                        context &&
                        context.form
                            ? context.form
                            : form;

                    submittedForm.reset();

                    if (
                        typeof window.gtag ===
                        'function'
                    ) {
                        window.gtag(
                            'event',
                            'contact_form_submit',
                            {
                                form_name:
                                    'StudentCalcTools Contact Us'
                            }
                        );
                    }
                }
        }
    );
})();
