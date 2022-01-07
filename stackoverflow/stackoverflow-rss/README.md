# Return a RSS feed from a Stack Overflow Question Query

Stack Overflow exposes a fairly limited query via the /question endpoint.  This integration performs a query on
demand, and returns a correctly formed RSS feed XML file.

This is ideal for sending results into the RSS reader of your choice.  Many are smart enough to rate limit how
often they query the RSS feed as well, which helps reduce credit consumption on Stack Overflow's side.
