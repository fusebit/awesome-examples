# Load paginated data and graph

This example loads paginated data from Linear, in this case the number of issues, and renders a graph showing
the estimated cost of completed tickets for the past cycles per user.

# Usage

Start the process by loading the data, which returns the task ID of the asynchronous loading operation.

```sh
$ curl -XPOST https://fusebit.io/.../api/tenant/user-1/task/
{"taskId":12345}
```

Check to see if the task has completed:

```sh
$ curl https://fusebit.io/.../api/tenant/user-1/task/12345/status
{"done":true}
```

Load the url in the browser to see the graph:

```sh
$ open https://fusebit.io/.../api/tenant/user-i1/task/12345/graph
```
