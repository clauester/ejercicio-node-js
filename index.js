require('dotenv').config()
require('./mongo')
const express = require('express')
const app = express()
const cors = require('cors')
const Sentry = require('@sentry/node')
const Tracing = require("@sentry/tracing")

const Note = require('./models/Note')
const { request } = require('express')
const notFound = require('./middleware/notFound')
const handleErrors = require('./middleware/handleErrors')

app.use(cors())
app.use(express.json())

let notes = []

Sentry.init({
    dsn: "https://542466e1f64847249c68b59c1e18550d@o1234379.ingest.sentry.io/6383647",
    integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
});
// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

app.get('/', (request, response) => {
    response.send('<h1>Hello World</h1>')
})

app.get('/api/notes', (request, response) => {
    Note.find({}).then(notes => {

        response.json(notes)
    })
})
app.get('/api/notes/:id', (request, response, next) => {
    const { id } = request.params

    Note.findById(id).then(note => {

        if (note) {
            response.json(note)
        } else {
            response.status(404).end()
        }
    }).catch(err => {
        next(err)
    })

})

app.put('/api/notes/:id', (request, response, next) => {
    const { id } = request.params
    const note = request.body

    const NewNoteInfo = {
        content: note.content,
        important: note.important
    }

    Note.findByIdAndUpdate(id, NewNoteInfo, { new: true })
        .then(result => {
            response.json(result)
        })
})

app.delete('/api/notes/:id', (request, response, next) => {
    const { id } = request.params

    Note.findByIdAndDelete(id).then(result => {
        response.status(204).end()
    }).catch(error => next(error))
    response.status(204).end()
})

app.post('/api/notes', (request, response) => {
    const note = request.body

    if (!note.content) {
        return response.status(400).json({
            error: 'required "content" field is missing'
        })
    }

    const newNote = new Note({
        content: note.content,
        important: note.important || false,
        date: new Date()
    })


    newNote.save().then(savedNote => {

        response.json(savedNote)
    })
})

app.use(notFound)
// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());
app.use(handleErrors)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
