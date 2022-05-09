module.exports= (error, request, response, next) => {
    console.error(error)

    if(error.name === 'CastError'){
        response.status(400).send({error: 'La id esta mal usada'})
    }else{
        response.status(500).end()
    }
}