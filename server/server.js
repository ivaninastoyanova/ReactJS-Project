(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
        typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
            (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) {
    'use strict';

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError';
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError';
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError';
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError';
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError';
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError';
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }

            if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html?module';\nimport { until } from 'https://unpkg.com/lit-html/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k, v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
        function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
        users: {
            "35c62d76-8152-4626-8712-eeb96381bea8": {
                email: "peter@abv.bg",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            },
            "847ec027-f659-4086-8032-5173e2f9c93a": {
                email: "john@abv.bg",
                hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
            }
        },
        sessions: {
        }
    };
    var seedData = {
        games: {
            "ff436770-76c5-40e2-b231-77409eda7a61": {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "CoverFire",
                "category": "Action",
                "maxLevel": "70",
                "imageUrl": "/images/CoverFire.png",
                "summary": "Best action shooter game, easy controls, realistic 3D graphics and fun offline missions. Get your best shooting gun and take to action!",
                "_createdOn": 1617194128618,
            },
            "1840a313-225c-416a-817a-9954d4609f7c": {
                "_ownerId": "35c62d76-8152-4626-8712-eeb96381bea8",
                "title": "MineCraft",
                "category": "Arcade",
                "maxLevel": "250",
                "imageUrl": "/images/MineCraft.png",
                "summary": "Set in a world where fantasy creatures live side by side with humans. A human cop is forced to work with an Orc to find a weapon everyone is prepared to kill for. Set in a world where fantasy creatures live side by side with humans. A human cop is forced to work with an Orc to find a weapon everyone is prepared to kill for.",
                "_createdOn": 1617194210928,
            },
            "126777f5-3277-42ad-b874-76d043b069cb": {
                "_ownerId": "847ec027-f659-4086-8032-5173e2f9c93a",
                "title": "Zombie Lang",
                "category": "Vertical Shooter",
                "maxLevel": "100",
                "imageUrl": "/images/ZombieLang.png",
                "summary": "With it’s own unique story, set between the events of the first movie, Zombieland: Double Tap- Road Trip is a ridiculously fun top-down twin-stick shooter featuring local co-op multiplayer for up to four players. Play as your favorite heroes from the original — Tallahassee, Columbus, Wichita and Little Rock — as well as new unlockable characters from the upcoming sequel.  The game embraces the game-like elements seen in the film by  incorporating everything from the “Rules” to “Zombie Kill of the Week”.  Use your special abilities, an arsenal of weapons and the essential Zombieland rules for survival to stay alive against huge numbers of uniquely grotesque and dangerous undead monstrosities in Zombieland: Double Tap- Road Trip’s story-based campaign mode, wave-based horde mode, and boss battles.",
                "_createdOn": 1617194295474,
            }
        },
        
        recipes: {
            "4a878339-fc59-4227-9e44-63ae19230ffb": {
                "_ownerId": "91836e7d-3f3e-41eb-a76f-ae4ad1fb52a4",
                "name": "Caesar Salad",
                "type": "Salad",
                "imageUrl": "https://www.billyparisi.com/wp-content/uploads/2020/05/caesar-salad-2.jpg",
                "description": "Step 1.\r\nCover 4 plates with lettuce.\r\n\r\nStep 2.\r\nTop with all remaining ingredients except dressing.\r\n\r\nStep 3.\r\nDrizzle with dressing just before serving.",
                "likes": [],
                "_createdOn": 1639836397078,
                
            },
            "6b29fb49-1c93-4090-9a7a-411fc21359ed" :{
                "_ownerId": "91836e7d-3f3e-41eb-a76f-ae4ad1fb52a4",
                "name": "Guacamole",
                "type": "Starter",
                "imageUrl": "https://natashaskitchen.com/wp-content/uploads/2020/05/Guacamole-Recipe-5-500x500.jpg",
                "description": "Step 1.\r\nMash avocados, sea salt, garlic powder, and lime juice in a bowl using a fork.\r\n\r\nStep 2.\r\nMix onion, tomatoes, and cilantro into avocado mixture; season with cayenne pepper.",
                "likes": [],
                "_createdOn": 1639835945150,
                
            },
                "bd2e54b5-e2a6-4074-994b-9ce589b9bd23" : {
                "_ownerId": "fbd90df3-c335-451e-ba61-5b90bc983b03",
                "name": "Lasagna",
                "type": "Main Course",
                "imageUrl": "https://www.modernhoney.com/wp-content/uploads/2019/08/Classic-Lasagna-14-scaled.jpg",
                "description": "Step 1.\r\nIn a Dutch oven, cook sausage, ground beef, onion, and garlic over medium heat until well browned. Stir in crushed tomatoes, tomato paste, tomato sauce, and water. Season with sugar, basil, fennel seeds, Italian seasoning, 1 teaspoon salt, pepper, and 2 tablespoons parsley. Simmer, covered, for about 1 1/2 hours, stirring occasionally.\r\n\r\nStep 2.\r\nBring a large pot of lightly salted water to a boil. Cook lasagna noodles in boiling water for 8 to 10 minutes. Drain noodles, and rinse with cold water. In a mixing bowl, combine ricotta cheese with egg, remaining parsley, and 1/2 teaspoon salt.\r\n\r\nStep 3.\r\nPreheat oven to 375 degrees F (190 degrees C).\r\n\r\nStep 4.\r\nTo assemble, spread 1 1/2 cups of meat sauce in the bottom of a 9x13-inch baking dish. Arrange 6 noodles lengthwise over meat sauce. Spread with one half of the ricotta cheese mixture. Top with a third of mozzarella cheese slices. Spoon 1 1/2 cups meat sauce over mozzarella, and sprinkle with 1/4 cup Parmesan cheese. Repeat layers, and top with remaining mozzarella and Parmesan cheese. Cover with foil: to prevent sticking, either spray foil with cooking spray, or make sure the foil does not touch the cheese.\r\n\r\nStep 5.\r\nBake in preheated oven for 25 minutes. Remove foil, and bake an additional 25 minutes. Cool for 15 minutes before serving.",
                "likes": [],
                "_createdOn": 1639834572135,
               
            },
              "7f09280e-8956-42de-8769-a405f83febd3" :     {
                "_ownerId": "fbd90df3-c335-451e-ba61-5b90bc983b03",
                "name": "Salmon Florentine",
                "type": "Main Course",
                "imageUrl": "data:image/jpeg;base64,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",
                "description": "Step 1.\r\nMelt 1/2 cup butter in a large skillet over medium-high heat; cook and stir onion and 1/2 of the garlic, breaking onion into rings, until softened, 5 to 10 minutes. Add salmon to onion mixture and cook until salmon is about 1/4-cooked, about 2 minutes.\r\n\r\nStep 2.\r\nPour wine and cream over salmon and cook, stirring lightly and flipping salmon halfway through, until liquid is reduced by 1/2 and salmon flakes easily with a fork, 5 to 10 minutes.\r\n\r\nStep 3.\r\nMelt 1 tablespoon butter in a skillet over medium heat; cook and stir remaining garlic until fragrant and golden, 1 to 3 minutes. Add spinach and cook until spinach is wilted, 3 to 4 minutes.\r\n\r\nStep 4.\r\nPlace spinach on 2 serving plates, making a well in the center of each. Arrange each salmon steak in the center of the well and pour sauce over each. Garnish salmon with onion.",
                "likes": [],
                "_createdOn": 1639835033342,
            },

                "950ed948-4c9f-41a3-935b-1f1d73848e86" : {
                "_ownerId": "fbd90df3-c335-451e-ba61-5b90bc983b03",
                "name": "Chocolate Cake",
                "type": "Dessert",
                "imageUrl": "https://www.recipetineats.com/wp-content/uploads/2018/03/Chocolate-Cake_9-SQ.jpg",
                "description": "Step 1.\r\nHeat oven to 350 degrees F. Grease and flour two 9-inch round baking pans.\r\n\r\nStep 2.\r\nStir together sugar, flour, cocoa, baking powder, baking soda and salt in large bowl. Add eggs, milk, oil and vanilla; beat on medium speed of mixer 2 minutes. Stir in boiling water (batter will be thin). Pour batter into prepared pans.\r\n\r\nStep 3.\r\nBake 30 to 35 minutes or until wooden pick inserted in center comes out clean. Cool 10 minutes; remove from pans to wire racks. Cool completely. Frost with \"PERFECTLY CHOCOLATE\" CHOCOLATE FROSTING.\r\n\r\nStep 4.\r\n\"PERFECTLY CHOCOLATE\" CHOCOLATE FROSTING: Melt butter. Stir in cocoa. Alternately add powdered sugar and milk, beating to spreading consistency.\r\n\r\nStep 5.\r\nAdd small amount additional milk, if needed. Stir in vanilla.",
                "likes": [],
                "_createdOn": 1639835123764,
            },
             
            
            "1272be6d-66ef-4308-b3a7-8fc2aff63b7f" :{
                "_ownerId": "91836e7d-3f3e-41eb-a76f-ae4ad1fb52a4",
                "name": "Raspberry Cheesecake",
                "type": "Dessert",
                "imageUrl": "https://driscolls.imgix.net/-/media/assets/recipes/raspberry-cheesecake-with-grand-marnier.ashx?w=1200&h=900&fit=crop&crop=entropy&q=50&auto=format%2Ccompress&cs=srgb&ixlib=imgixjs-3.4.2",
                "description": "Step 1.\r\nIn a large bowl, cream together cream cheese and sugar. Set aside. In a separate bowl, whip cream until stiff peaks form. Fold whipped cream into cream cheese mixture.\r\n\r\nStep 2.\r\nLine the bottom and sides of a 9 inch springform pan with cookies. Pour half of the cheese mixture over the cookies. Top with half the raspberry filling and spread evenly. Place another layer of cookies over raspberry and repeat cheese and raspberry layers. Chill in refrigerator 4 hours or overnight before unmolding and serving.",
                "likes": [],
                "_createdOn": 1639836556567,
                
            },
        },

        likes: {

        }
    };
    var rules$1 = {
        users: {
            ".create": false,
            ".read": [
                "Owner"
            ],
            ".update": false,
            ".delete": false
        }
    };
    var settings = {
        identity: identity,
        protectedData: protectedData,
        seedData: seedData,
        rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = 3030;
    server.listen(port);
    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = {

    };

    return softuniPracticeServer;

})));
