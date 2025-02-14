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
            res.status(500).send({ error: (error as Error).message });
        }
    }

    public async placeBet(req: Request, res: Response): Promise<void> {
        const { playerId, amount, autoMode } = req.body;
        try {
            const result = await this.gameService.placeBet(playerId, amount, autoMode);
            res.status(200).send(result)
        } catch (error) {
            res.status(400).send({ error: (error as Error).message });
        }
    }

    public async handleCashout(req: Request, res: Response): Promise<void> {
        const { playerId } = req.body;
        try {
            const result = await this.gameService.handleCashout(playerId);
            res.status(200).send(result);
        } catch (error) {
            res.status(400).send({ error: (error as Error).message });
        }
    }
}

