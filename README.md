This is my solution to the problem presented in 01_Descriptoin.md (not included in this repository.)

### Approach

I used a loose MVC organization and built a basic modular framework for syncing forms, templates, and models.

I built function-style JS classes for my models (UserModel and BlockModel) and controllers (UserListController, UserAdminController, and CalendarController)

It's over programed, because I got carried away seeing if I could replicate the data-binding features from my favorite frameworks w/o using the internet.

### Known Issues

Because the template framework I built from scratch is, well, built from scratch in just a couple hours, it leaves several tasks that should be handled by the view to the controllers (setting colors on the user lost and scheduled blocks, for instance.)

It's not tested. I started developing it on a plane and couldn't download node or test frameworks.

There's a bug I can't track down that shows and then deletes the user when you press enter after entering the first user.

Also, currently if one user is selected and an appointment block assigned to a different user is clicked, the existing appointment is removed from the block, but a new one isn't added.

### Things I'd do Differently

Use require.js to break models into separate files, with more strict namespacing and dependency declarations.

I'd definitely separate out the frameworky-bits (Observable, ObservableArray, TemplateTools) into separate libraries.