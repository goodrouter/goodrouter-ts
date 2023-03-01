import assert from "assert";
import test from "tape-promise/tape.js";
import { Router } from "./router.js";

test("router-readme", async t => {
    const router = new Router();

    router.insertRoute("all-products", "/product/all");
    router.insertRoute("product-detail", "/product/{id}");

    // And now we can parse routes!

    {
        const [routeName] = router.parseRoute("/not-found");
        assert.equal(routeName, null);
    }

    {
        const [routeName] = router.parseRoute("/product/all");
        assert.equal(routeName, "all-products");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/product/1");
        assert.equal(routeName, "product-detail");
        assert.deepEqual(routeParameters, { id: "1" });
    }

    // And we can stringify routes

    {
        const path = router.stringifyRoute("all-products");
        assert.equal(path, "/product/all");
    }

    {
        const path = router.stringifyRoute("product-detail", { id: "2" });
        assert.equal(path, "/product/2");
    }
});

test("parse-route 1", async t => {
    const router = new Router();

    router.insertRoute("a", "/a");
    router.insertRoute("b", "/b/{x}");
    router.insertRoute("c", "/b/{x}/c");
    router.insertRoute("d", "/b/{x}/d");

    {
        const [routeName] = router.parseRoute("/a");
        t.equal(routeName, "a");
    }
    {
        const [routeName] = router.parseRoute("/b/x");
        t.equal(routeName, "b");
    }
    {
        const [routeName] = router.parseRoute("/b/y/c");
        t.equal(routeName, "c");
    }
    {
        const [routeName] = router.parseRoute("/b/z/d");
        t.equal(routeName, "d");
    }

});

test("parse-route 2", async t => {
    const router = new Router();

    router.insertRoute("aa", "a/{a}/a");
    router.insertRoute("a", "a");

    router.insertRoute("one", "/a");
    router.insertRoute("two", "/a/{x}/{y}");
    router.insertRoute("three", "/c/{x}");
    router.insertRoute("four", "/c/{x}/{y}/");

    {
        const [routeName, routeParameters] = router.parseRoute("/a");
        t.equal(routeName, "one");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/a/1/2");
        t.equal(routeName, "two");
        t.deepEqual(routeParameters, { x: "1", y: "2" });
    }

    {
        const path = router.stringifyRoute(
            "two",
            { x: "1", y: "2" },
        );
        assert(path);
        t.equal(path, "/a/1/2");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3");
        t.equal(routeName, "three");
        t.deepEqual(routeParameters, { x: "3" });
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3/4");
        t.equal(routeName, "three");
        t.deepEqual(routeParameters, { x: "3/4" });
    }

    {
        const path = router.stringifyRoute(
            "three",
            { x: "3/4" },
        );
        assert(path);
        t.equal(path, "/c/3%2F4");
    }

    {
        const [routeName, routeParameters] = router.parseRoute("/c/3/4/");
        t.equal(routeName, "four");
        t.deepEqual(routeParameters, { x: "3", y: "4" });
    }
});

test("router bug", async t => {
    const router = new Router();

    router
        .insertRoute("a", "/enterprises/{enterprise}/actions/runner-groups")
        .insertRoute(
            "b",
            "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}",
        )
        .insertRoute(
            "c",
            "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations",
        );

    t.deepEqual(
        router.parseRoute("/enterprises/xx/actions/runner-groups"),
        ["a", { "enterprise": "xx" }],
    );

    t.deepEqual(
        router.parseRoute("/enterprises/xx/actions/runner-groups/yy"),
        ["b", { "enterprise": "xx", "runner_group_id": "yy" }],
    );

    t.deepEqual(
        router.parseRoute("/enterprises/xx/actions/runner-groups/yy/organizations"),
        ["c", { "enterprise": "xx", "runner_group_id": "yy" }],
    );

});

test("github routes", async t => {
    const templates = [
        "/",
        "/admin/hooks",
        "/admin/hooks/{hook_id}",
        "/admin/hooks/{hook_id}/pings",
        "/admin/keys",
        "/admin/keys/{key_ids}",
        "/admin/ldap/teams/{team_id}/mapping",
        "/admin/ldap/teams/{team_id}/sync",
        "/admin/ldap/users/{username}/mapping",
        "/admin/ldap/users/{username}/sync",
        "/admin/organizations",
        "/admin/organizations/{org}",
        "/admin/pre-receive-environments",
        "/admin/pre-receive-environments/{pre_receive_environment_id}",
        "/admin/pre-receive-environments/{pre_receive_environment_id}/downloads",
        "/admin/pre-receive-environments/{pre_receive_environment_id}/downloads/latest",
        "/admin/pre-receive-hooks",
        "/admin/pre-receive-hooks/{pre_receive_hook_id}",
        "/admin/tokens",
        "/admin/tokens/{token_id}",
        "/admin/users",
        "/admin/users/{username}",
        "/admin/users/{username}/authorizations",
        "/app",
        "/app-manifests/{code}/conversions",
        "/app/hook/config",
        "/app/hook/deliveries",
        "/app/hook/deliveries/{delivery_id}",
        "/app/hook/deliveries/{delivery_id}/attempts",
        "/app/installations",
        "/app/installations/{installation_id}",
        "/app/installations/{installation_id}/access_tokens",
        "/app/installations/{installation_id}/suspended",
        "/applications/grants",
        "/applications/grants/{grant_id}",
        "/applications/{client_id}/grant",
        "/applications/{client_id}/token",
        "/applications/{client_id}/token/scoped",
        "/apps/{app_slug}",
        "/authorizations",
        "/authorizations/clients/{client_id}",
        "/authorizations/clients/{client_id}/{fingerprint}",
        "/authorizations/{authorization_id}",
        "/codes_of_conduct",
        "/codes_of_conduct/{key}",
        "/emojis",
        "/enterprise/announcement",
        "/enterprise/settings/license",
        "/enterprise/stats/all",
        "/enterprise/stats/comments",
        "/enterprise/stats/gists",
        "/enterprise/stats/hooks",
        "/enterprise/stats/issues",
        "/enterprise/stats/milestones",
        "/enterprise/stats/orgs",
        "/enterprise/stats/pages",
        "/enterprise/stats/pulls",
        "/enterprise/stats/repos",
        "/enterprise/stats/users",
        "/enterprises/{enterprise}/actions/cache/usage",
        "/enterprises/{enterprise}/actions/cache/usage-policy",
        "/enterprises/{enterprise}/actions/permissions",
        "/enterprises/{enterprise}/actions/permissions/organizations",
        "/enterprises/{enterprise}/actions/permissions/organizations/{org_id}",
        "/enterprises/{enterprise}/actions/permissions/selected-actions",
        "/enterprises/{enterprise}/actions/permissions/workflow",
        "/enterprises/{enterprise}/actions/runner-groups",
        "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}",
        "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations",
        "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/organizations/{org_id}",
        "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners",
        "/enterprises/{enterprise}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
        "/enterprises/{enterprise}/actions/runners",
        "/enterprises/{enterprise}/actions/runners/downloads",
        "/enterprises/{enterprise}/actions/runners/registration-token",
        "/enterprises/{enterprise}/actions/runners/remove-token",
        "/enterprises/{enterprise}/actions/runners/{runner_id}",
        "/enterprises/{enterprise}/actions/runners/{runner_id}/labels",
        "/enterprises/{enterprise}/actions/runners/{runner_id}/labels/{name}",
        "/enterprises/{enterprise}/audit-log",
        "/enterprises/{enterprise}/code-scanning/alerts",
        "/enterprises/{enterprise}/code_security_and_analysis",
        "/enterprises/{enterprise}/dependabot/alerts",
        "/enterprises/{enterprise}/secret-scanning/alerts",
        "/enterprises/{enterprise}/settings/billing/advanced-security",
        "/enterprises/{enterprise}/{security_product}/{enablement}",
        "/events",
        "/feeds",
        "/gists",
        "/gists/public",
        "/gists/starred",
        "/gists/{gist_id}",
        "/gists/{gist_id}/comments",
        "/gists/{gist_id}/comments/{comment_id}",
        "/gists/{gist_id}/commits",
        "/gists/{gist_id}/forks",
        "/gists/{gist_id}/star",
        "/gists/{gist_id}/{sha}",
        "/gitignore/templates",
        "/gitignore/templates/{name}",
        "/installation/repositories",
        "/installation/token",
        "/issues",
        "/licenses",
        "/licenses/{license}",
        "/markdown",
        "/markdown/raw",
        "/meta",
        "/networks/{owner}/{repo}/events",
        "/notifications",
        "/notifications/threads/{thread_id}",
        "/notifications/threads/{thread_id}/subscription",
        "/octocat",
        "/organizations",
        "/organizations/{organization_id}/custom_roles",
        "/orgs/{org}",
        "/orgs/{org}/actions/cache/usage",
        "/orgs/{org}/actions/cache/usage-by-repository",
        "/orgs/{org}/actions/oidc/customization/sub",
        "/orgs/{org}/actions/permissions",
        "/orgs/{org}/actions/permissions/repositories",
        "/orgs/{org}/actions/permissions/repositories/{repository_id}",
        "/orgs/{org}/actions/permissions/selected-actions",
        "/orgs/{org}/actions/permissions/workflow",
        "/orgs/{org}/actions/required_workflows",
        "/orgs/{org}/actions/required_workflows/{required_workflow_id}",
        "/orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories",
        "/orgs/{org}/actions/required_workflows/{required_workflow_id}/repositories/{repository_id}",
        "/orgs/{org}/actions/runner-groups",
        "/orgs/{org}/actions/runner-groups/{runner_group_id}",
        "/orgs/{org}/actions/runner-groups/{runner_group_id}/repositories",
        "/orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}",
        "/orgs/{org}/actions/runner-groups/{runner_group_id}/runners",
        "/orgs/{org}/actions/runner-groups/{runner_group_id}/runners/{runner_id}",
        "/orgs/{org}/actions/runners",
        "/orgs/{org}/actions/runners/downloads",
        "/orgs/{org}/actions/runners/registration-token",
        "/orgs/{org}/actions/runners/remove-token",
        "/orgs/{org}/actions/runners/{runner_id}",
        "/orgs/{org}/actions/runners/{runner_id}/labels",
        "/orgs/{org}/actions/runners/{runner_id}/labels/{name}",
        "/orgs/{org}/actions/secrets",
        "/orgs/{org}/actions/secrets/public-key",
        "/orgs/{org}/actions/secrets/{secret_name}",
        "/orgs/{org}/actions/secrets/{secret_name}/repositories",
        "/orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}",
        "/orgs/{org}/actions/variables",
        "/orgs/{org}/actions/variables/{name}",
        "/orgs/{org}/actions/variables/{name}/repositories",
        "/orgs/{org}/actions/variables/{name}/repositories/{repository_id}",
        "/orgs/{org}/announcement",
        "/orgs/{org}/audit-log",
        "/orgs/{org}/code-scanning/alerts",
        "/orgs/{org}/dependabot/alerts",
        "/orgs/{org}/dependabot/secrets",
        "/orgs/{org}/dependabot/secrets/public-key",
        "/orgs/{org}/dependabot/secrets/{secret_name}",
        "/orgs/{org}/dependabot/secrets/{secret_name}/repositories",
        "/orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}",
        "/orgs/{org}/events",
        "/orgs/{org}/external-group/{group_id}",
        "/orgs/{org}/external-groups",
        "/orgs/{org}/hooks",
        "/orgs/{org}/hooks/{hook_id}",
        "/orgs/{org}/hooks/{hook_id}/config",
        "/orgs/{org}/hooks/{hook_id}/deliveries",
        "/orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}",
        "/orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
        "/orgs/{org}/hooks/{hook_id}/pings",
        "/orgs/{org}/installation",
        "/orgs/{org}/installations",
        "/orgs/{org}/issues",
        "/orgs/{org}/members",
        "/orgs/{org}/members/{username}",
        "/orgs/{org}/memberships/{username}",
        "/orgs/{org}/migrations",
        "/orgs/{org}/migrations/{migration_id}",
        "/orgs/{org}/migrations/{migration_id}/archive",
        "/orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock",
        "/orgs/{org}/migrations/{migration_id}/repositories",
        "/orgs/{org}/outside_collaborators",
        "/orgs/{org}/outside_collaborators/{username}",
        "/orgs/{org}/pre-receive-hooks",
        "/orgs/{org}/pre-receive-hooks/{pre_receive_hook_id}",
        "/orgs/{org}/projects",
        "/orgs/{org}/public_members",
        "/orgs/{org}/public_members/{username}",
        "/orgs/{org}/repos",
        "/orgs/{org}/secret-scanning/alerts",
        "/orgs/{org}/security-managers",
        "/orgs/{org}/security-managers/teams/{team_slug}",
        "/orgs/{org}/settings/billing/advanced-security",
        "/orgs/{org}/teams",
        "/orgs/{org}/teams/{team_slug}",
        "/orgs/{org}/teams/{team_slug}/discussions",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions",
        "/orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}",
        "/orgs/{org}/teams/{team_slug}/external-groups",
        "/orgs/{org}/teams/{team_slug}/members",
        "/orgs/{org}/teams/{team_slug}/memberships/{username}",
        "/orgs/{org}/teams/{team_slug}/projects",
        "/orgs/{org}/teams/{team_slug}/projects/{project_id}",
        "/orgs/{org}/teams/{team_slug}/repos",
        "/orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}",
        "/orgs/{org}/teams/{team_slug}/teams",
        "/orgs/{org}/{security_product}/{enablement}",
        "/projects/columns/cards/{card_id}",
        "/projects/columns/cards/{card_id}/moves",
        "/projects/columns/{column_id}",
        "/projects/columns/{column_id}/cards",
        "/projects/columns/{column_id}/moves",
        "/projects/{project_id}",
        "/projects/{project_id}/collaborators",
        "/projects/{project_id}/collaborators/{username}",
        "/projects/{project_id}/collaborators/{username}/permission",
        "/projects/{project_id}/columns",
        "/rate_limit",
        "/repos/{org}/{repo}/actions/required_workflows",
        "/repos/{org}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}",
        "/repos/{owner}/{repo}",
        "/repos/{owner}/{repo}/actions/artifacts",
        "/repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
        "/repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}",
        "/repos/{owner}/{repo}/actions/cache/usage",
        "/repos/{owner}/{repo}/actions/cache/usage-policy",
        "/repos/{owner}/{repo}/actions/caches",
        "/repos/{owner}/{repo}/actions/caches/{cache_id}",
        "/repos/{owner}/{repo}/actions/jobs/{job_id}",
        "/repos/{owner}/{repo}/actions/jobs/{job_id}/logs",
        "/repos/{owner}/{repo}/actions/jobs/{job_id}/rerun",
        "/repos/{owner}/{repo}/actions/oidc/customization/sub",
        "/repos/{owner}/{repo}/actions/permissions",
        "/repos/{owner}/{repo}/actions/permissions/access",
        "/repos/{owner}/{repo}/actions/permissions/selected-actions",
        "/repos/{owner}/{repo}/actions/permissions/workflow",
        "/repos/{owner}/{repo}/actions/required_workflows/{required_workflow_id_for_repo}/runs",
        "/repos/{owner}/{repo}/actions/runners",
        "/repos/{owner}/{repo}/actions/runners/downloads",
        "/repos/{owner}/{repo}/actions/runners/registration-token",
        "/repos/{owner}/{repo}/actions/runners/remove-token",
        "/repos/{owner}/{repo}/actions/runners/{runner_id}",
        "/repos/{owner}/{repo}/actions/runners/{runner_id}/labels",
        "/repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}",
        "/repos/{owner}/{repo}/actions/runs",
        "/repos/{owner}/{repo}/actions/runs/{run_id}",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/approvals",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/artifacts",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/cancel",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/jobs",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/logs",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/rerun",
        "/repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs",
        "/repos/{owner}/{repo}/actions/secrets",
        "/repos/{owner}/{repo}/actions/secrets/public-key",
        "/repos/{owner}/{repo}/actions/secrets/{secret_name}",
        "/repos/{owner}/{repo}/actions/variables",
        "/repos/{owner}/{repo}/actions/variables/{name}",
        "/repos/{owner}/{repo}/actions/workflows",
        "/repos/{owner}/{repo}/actions/workflows/{workflow_id}",
        "/repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable",
        "/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches",
        "/repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable",
        "/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs",
        "/repos/{owner}/{repo}/assignees",
        "/repos/{owner}/{repo}/assignees/{assignee}",
        "/repos/{owner}/{repo}/autolinks",
        "/repos/{owner}/{repo}/autolinks/{autolink_id}",
        "/repos/{owner}/{repo}/branches",
        "/repos/{owner}/{repo}/branches/{branch}",
        "/repos/{owner}/{repo}/branches/{branch}/protection",
        "/repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins",
        "/repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews",
        "/repos/{owner}/{repo}/branches/{branch}/protection/required_signatures",
        "/repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
        "/repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
        "/repos/{owner}/{repo}/branches/{branch}/protection/restrictions",
        "/repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
        "/repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
        "/repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
        "/repos/{owner}/{repo}/branches/{branch}/rename",
        "/repos/{owner}/{repo}/check-runs",
        "/repos/{owner}/{repo}/check-runs/{check_run_id}",
        "/repos/{owner}/{repo}/check-runs/{check_run_id}/annotations",
        "/repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest",
        "/repos/{owner}/{repo}/check-suites",
        "/repos/{owner}/{repo}/check-suites/preferences",
        "/repos/{owner}/{repo}/check-suites/{check_suite_id}",
        "/repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs",
        "/repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest",
        "/repos/{owner}/{repo}/code-scanning/alerts",
        "/repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
        "/repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
        "/repos/{owner}/{repo}/code-scanning/analyses",
        "/repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}",
        "/repos/{owner}/{repo}/code-scanning/sarifs",
        "/repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}",
        "/repos/{owner}/{repo}/codeowners/errors",
        "/repos/{owner}/{repo}/collaborators",
        "/repos/{owner}/{repo}/collaborators/{username}",
        "/repos/{owner}/{repo}/collaborators/{username}/permission",
        "/repos/{owner}/{repo}/comments",
        "/repos/{owner}/{repo}/comments/{comment_id}",
        "/repos/{owner}/{repo}/comments/{comment_id}/reactions",
        "/repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}",
        "/repos/{owner}/{repo}/commits",
        "/repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head",
        "/repos/{owner}/{repo}/commits/{commit_sha}/comments",
        "/repos/{owner}/{repo}/commits/{commit_sha}/pulls",
        "/repos/{owner}/{repo}/commits/{ref}",
        "/repos/{owner}/{repo}/commits/{ref}/check-runs",
        "/repos/{owner}/{repo}/commits/{ref}/check-suites",
        "/repos/{owner}/{repo}/commits/{ref}/status",
        "/repos/{owner}/{repo}/commits/{ref}/statuses",
        "/repos/{owner}/{repo}/compare/{basehead}",
        "/repos/{owner}/{repo}/contents/{path}",
        "/repos/{owner}/{repo}/contributors",
        "/repos/{owner}/{repo}/dependabot/alerts",
        "/repos/{owner}/{repo}/dependabot/alerts/{alert_number}",
        "/repos/{owner}/{repo}/dependabot/secrets",
        "/repos/{owner}/{repo}/dependabot/secrets/public-key",
        "/repos/{owner}/{repo}/dependabot/secrets/{secret_name}",
        "/repos/{owner}/{repo}/dependency-graph/compare/{basehead}",
        "/repos/{owner}/{repo}/dependency-graph/snapshots",
        "/repos/{owner}/{repo}/deployments",
        "/repos/{owner}/{repo}/deployments/{deployment_id}",
        "/repos/{owner}/{repo}/deployments/{deployment_id}/statuses",
        "/repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}",
        "/repos/{owner}/{repo}/dispatches",
        "/repos/{owner}/{repo}/environments",
        "/repos/{owner}/{repo}/environments/{environment_name}",
        "/repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies",
        "/repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}",
        "/repos/{owner}/{repo}/events",
        "/repos/{owner}/{repo}/forks",
        "/repos/{owner}/{repo}/git/blobs",
        "/repos/{owner}/{repo}/git/blobs/{file_sha}",
        "/repos/{owner}/{repo}/git/commits",
        "/repos/{owner}/{repo}/git/commits/{commit_sha}",
        "/repos/{owner}/{repo}/git/matching-refs/{ref}",
        "/repos/{owner}/{repo}/git/ref/{ref}",
        "/repos/{owner}/{repo}/git/refs",
        "/repos/{owner}/{repo}/git/refs/{ref}",
        "/repos/{owner}/{repo}/git/tags",
        "/repos/{owner}/{repo}/git/tags/{tag_sha}",
        "/repos/{owner}/{repo}/git/trees",
        "/repos/{owner}/{repo}/git/trees/{tree_sha}",
        "/repos/{owner}/{repo}/hooks",
        "/repos/{owner}/{repo}/hooks/{hook_id}",
        "/repos/{owner}/{repo}/hooks/{hook_id}/config",
        "/repos/{owner}/{repo}/hooks/{hook_id}/deliveries",
        "/repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}",
        "/repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts",
        "/repos/{owner}/{repo}/hooks/{hook_id}/pings",
        "/repos/{owner}/{repo}/hooks/{hook_id}/tests",
        "/repos/{owner}/{repo}/installation",
        "/repos/{owner}/{repo}/invitations",
        "/repos/{owner}/{repo}/invitations/{invitation_id}",
        "/repos/{owner}/{repo}/issues",
        "/repos/{owner}/{repo}/issues/comments",
        "/repos/{owner}/{repo}/issues/comments/{comment_id}",
        "/repos/{owner}/{repo}/issues/comments/{comment_id}/reactions",
        "/repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}",
        "/repos/{owner}/{repo}/issues/events",
        "/repos/{owner}/{repo}/issues/events/{event_id}",
        "/repos/{owner}/{repo}/issues/{issue_number}",
        "/repos/{owner}/{repo}/issues/{issue_number}/assignees",
        "/repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}",
        "/repos/{owner}/{repo}/issues/{issue_number}/comments",
        "/repos/{owner}/{repo}/issues/{issue_number}/events",
        "/repos/{owner}/{repo}/issues/{issue_number}/labels",
        "/repos/{owner}/{repo}/issues/{issue_number}/labels/{name}",
        "/repos/{owner}/{repo}/issues/{issue_number}/lock",
        "/repos/{owner}/{repo}/issues/{issue_number}/reactions",
        "/repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}",
        "/repos/{owner}/{repo}/issues/{issue_number}/timeline",
        "/repos/{owner}/{repo}/keys",
        "/repos/{owner}/{repo}/keys/{key_id}",
        "/repos/{owner}/{repo}/labels",
        "/repos/{owner}/{repo}/labels/{name}",
        "/repos/{owner}/{repo}/languages",
        "/repos/{owner}/{repo}/lfs",
        "/repos/{owner}/{repo}/license",
        "/repos/{owner}/{repo}/merge-upstream",
        "/repos/{owner}/{repo}/merges",
        "/repos/{owner}/{repo}/milestones",
        "/repos/{owner}/{repo}/milestones/{milestone_number}",
        "/repos/{owner}/{repo}/milestones/{milestone_number}/labels",
        "/repos/{owner}/{repo}/notifications",
        "/repos/{owner}/{repo}/pages",
        "/repos/{owner}/{repo}/pages/builds",
        "/repos/{owner}/{repo}/pages/builds/latest",
        "/repos/{owner}/{repo}/pages/builds/{build_id}",
        "/repos/{owner}/{repo}/pages/deployment",
        "/repos/{owner}/{repo}/pre-receive-hooks",
        "/repos/{owner}/{repo}/pre-receive-hooks/{pre_receive_hook_id}",
        "/repos/{owner}/{repo}/projects",
        "/repos/{owner}/{repo}/pulls",
        "/repos/{owner}/{repo}/pulls/comments",
        "/repos/{owner}/{repo}/pulls/comments/{comment_id}",
        "/repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions",
        "/repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}",
        "/repos/{owner}/{repo}/pulls/{pull_number}",
        "/repos/{owner}/{repo}/pulls/{pull_number}/comments",
        "/repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
        "/repos/{owner}/{repo}/pulls/{pull_number}/commits",
        "/repos/{owner}/{repo}/pulls/{pull_number}/files",
        "/repos/{owner}/{repo}/pulls/{pull_number}/merge",
        "/repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals",
        "/repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events",
        "/repos/{owner}/{repo}/pulls/{pull_number}/update-branch",
        "/repos/{owner}/{repo}/readme",
        "/repos/{owner}/{repo}/readme/{dir}",
        "/repos/{owner}/{repo}/releases",
        "/repos/{owner}/{repo}/releases/assets/{asset_id}",
        "/repos/{owner}/{repo}/releases/generate-notes",
        "/repos/{owner}/{repo}/releases/latest",
        "/repos/{owner}/{repo}/releases/tags/{tag}",
        "/repos/{owner}/{repo}/releases/{release_id}",
        "/repos/{owner}/{repo}/releases/{release_id}/assets",
        "/repos/{owner}/{repo}/releases/{release_id}/reactions",
        "/repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}",
        "/repos/{owner}/{repo}/replicas/caches",
        "/repos/{owner}/{repo}/secret-scanning/alerts",
        "/repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}",
        "/repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations",
        "/repos/{owner}/{repo}/stargazers",
        "/repos/{owner}/{repo}/stats/code_frequency",
        "/repos/{owner}/{repo}/stats/commit_activity",
        "/repos/{owner}/{repo}/stats/contributors",
        "/repos/{owner}/{repo}/stats/participation",
        "/repos/{owner}/{repo}/stats/punch_card",
        "/repos/{owner}/{repo}/statuses/{sha}",
        "/repos/{owner}/{repo}/subscribers",
        "/repos/{owner}/{repo}/subscription",
        "/repos/{owner}/{repo}/tags",
        "/repos/{owner}/{repo}/tags/protection",
        "/repos/{owner}/{repo}/tags/protection/{tag_protection_id}",
        "/repos/{owner}/{repo}/tarball/{ref}",
        "/repos/{owner}/{repo}/teams",
        "/repos/{owner}/{repo}/topics",
        "/repos/{owner}/{repo}/transfer",
        "/repos/{owner}/{repo}/zipball/{ref}",
        "/repos/{template_owner}/{template_repo}/generate",
        "/repositories",
        "/repositories/{repository_id}/environments/{environment_name}/secrets",
        "/repositories/{repository_id}/environments/{environment_name}/secrets/public-key",
        "/repositories/{repository_id}/environments/{environment_name}/secrets/{secret_name}",
        "/repositories/{repository_id}/environments/{environment_name}/variables",
        "/repositories/{repository_id}/environments/{environment_name}/variables/{name}",
        "/scim/v2/Groups",
        "/scim/v2/Groups/{scim_group_id}",
        "/scim/v2/Users",
        "/scim/v2/Users/{scim_user_id}",
        "/search/code",
        "/search/commits",
        "/search/issues",
        "/search/labels",
        "/search/repositories",
        "/search/topics",
        "/search/users",
        "/setup/api/configcheck",
        "/setup/api/configure",
        "/setup/api/maintenance",
        "/setup/api/settings",
        "/setup/api/settings/authorized-keys",
        "/setup/api/start",
        "/setup/api/upgrade",
        "/teams/{team_id}",
        "/teams/{team_id}/discussions",
        "/teams/{team_id}/discussions/{discussion_number}",
        "/teams/{team_id}/discussions/{discussion_number}/comments",
        "/teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}",
        "/teams/{team_id}/discussions/{discussion_number}/comments/{comment_number}/reactions",
        "/teams/{team_id}/discussions/{discussion_number}/reactions",
        "/teams/{team_id}/members",
        "/teams/{team_id}/members/{username}",
        "/teams/{team_id}/memberships/{username}",
        "/teams/{team_id}/projects",
        "/teams/{team_id}/projects/{project_id}",
        "/teams/{team_id}/repos",
        "/teams/{team_id}/repos/{owner}/{repo}",
        "/teams/{team_id}/teams",
        "/user",
        "/user/emails",
        "/user/followers",
        "/user/following",
        "/user/following/{username}",
        "/user/gpg_keys",
        "/user/gpg_keys/{gpg_key_id}",
        "/user/installations",
        "/user/installations/{installation_id}/repositories",
        "/user/installations/{installation_id}/repositories/{repository_id}",
        "/user/issues",
        "/user/keys",
        "/user/keys/{key_id}",
        "/user/memberships/orgs",
        "/user/memberships/orgs/{org}",
        "/user/migrations",
        "/user/migrations/{migration_id}/archive",
        "/user/migrations/{migration_id}/repositories",
        "/user/orgs",
        "/user/projects",
        "/user/public_emails",
        "/user/repos",
        "/user/repository_invitations",
        "/user/repository_invitations/{invitation_id}",
        "/user/ssh_signing_keys",
        "/user/ssh_signing_keys/{ssh_signing_key_id}",
        "/user/starred",
        "/user/starred/{owner}/{repo}",
        "/user/subscriptions",
        "/user/teams",
        "/users",
        "/users/{username}",
        "/users/{username}/events",
        "/users/{username}/events/orgs/{org}",
        "/users/{username}/events/public",
        "/users/{username}/followers",
        "/users/{username}/following",
        "/users/{username}/following/{target_user}",
        "/users/{username}/gists",
        "/users/{username}/gpg_keys",
        "/users/{username}/hovercard",
        "/users/{username}/installation",
        "/users/{username}/keys",
        "/users/{username}/orgs",
        "/users/{username}/projects",
        "/users/{username}/received_events",
        "/users/{username}/received_events/public",
        "/users/{username}/repos",
        "/users/{username}/site_admin",
        "/users/{username}/ssh_signing_keys",
        "/users/{username}/starred",
        "/users/{username}/subscriptions",
        "/users/{username}/suspended",
        "/zen",
    ];

    const allParameterNames = [
        "alert_number",
        "analysis_id",
        "app_slug",
        "archive_format",
        "artifact_id",
        "asset_id",
        "assignee",
        "attempt_number",
        "authorization_id",
        "autolink_id",
        "basehead",
        "branch",
        "branch_policy_id",
        "build_id",
        "cache_id",
        "card_id",
        "check_run_id",
        "check_suite_id",
        "client_id",
        "code",
        "column_id",
        "comment_id",
        "comment_number",
        "commit_sha",
        "delivery_id",
        "deployment_id",
        "dir",
        "discussion_number",
        "enablement",
        "enterprise",
        "environment_name",
        "event_id",
        "file_sha",
        "fingerprint",
        "gist_id",
        "gpg_key_id",
        "grant_id",
        "group_id",
        "hook_id",
        "installation_id",
        "invitation_id",
        "issue_number",
        "job_id",
        "key",
        "key_id",
        "key_ids",
        "license",
        "migration_id",
        "milestone_number",
        "name",
        "org",
        "organization_id",
        "org_id",
        "owner",
        "path",
        "pre_receive_environment_id",
        "pre_receive_hook_id",
        "project_id",
        "pull_number",
        "reaction_id",
        "ref",
        "release_id",
        "repo",
        "repo_name",
        "repository_id",
        "required_workflow_id",
        "required_workflow_id_for_repo",
        "review_id",
        "run_id",
        "runner_group_id",
        "runner_id",
        "sarif_id",
        "scim_group_id",
        "scim_user_id",
        "secret_name",
        "security_product",
        "sha",
        "ssh_signing_key_id",
        "status_id",
        "tag",
        "tag_protection_id",
        "tag_sha",
        "target_user",
        "team_id",
        "team_slug",
        "template_owner",
        "template_repo",
        "thread_id",
        "token_id",
        "tree_sha",
        "username",
        "workflow_id",
    ];

    const allParameters = Object.fromEntries(
        allParameterNames.map((name, index) => [name, String(index)]),
    );

    const templateCount = templates.length;

    const router = new Router();
    for (const template of templates) {
        router.insertRoute(template, template);
    }

    const paths = templates.map(template => {
        const path = router.stringifyRoute(template, allParameters);
        assert(path != null);
        return path;
    });

    for (let index = 0; index < templateCount; index++) {
        const path = paths[Number(index)];
        const template = templates[Number(index)];

        const [routeName, routeParameters] = router.parseRoute(path);
        const expectedParameters = Object.fromEntries(
            Object.keys(routeParameters).
                map(name => [name, allParameters[String(name)]]),
        );

        t.equal(routeName, template);
        t.deepEqual(routeParameters, expectedParameters);
    }

});
