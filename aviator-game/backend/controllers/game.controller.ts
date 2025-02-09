import { Request, Response } from 'express';
import { GameService } from '../services/game.service';

export class GameController {
    private gameService: GameService;

    constructor(gameService: GameService) {
        this.gameService = gameService;
    }

    public startGame(req: Request, res: Response): void {
        try {
            this.gameService.startGame();
            res.status(200).send({ message: 'Game started successfully' });
        } catch (error) {
            res.status(500).send({ error: error.message });
        }
    }

    public placeBet(req: Request, res: Response): void {
        const { playerId, amount, autoMode } = req.body;
        const result = this.gameService.placeBet(playerId, amount, autoMode);

        if (result.error) {
            res.status(400).send({ error: result.error });
        } else {
            res.status(200).send(result.data);
        }
    }

    public handleCashout(req: Request, res: Response): void {
        const { playerId } = req.body;
        const result = this.gameService.handleCashout(playerId);

        if (result.error) {
            res.status(400).send({ error: result.error });
        } else {
            res.status(200).send(result.data);
        }
    }
}
